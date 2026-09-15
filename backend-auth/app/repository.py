"""Database access for users + applications."""
from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Any

from psycopg.types.json import Jsonb

from .crypto import deep_protect
from .db import connection
from .normalize import summary_columns, to_canonical
from .security import CurrentUser

# Credentials are owned by Cognito, so the local users row carries a sentinel.
_COGNITO_PW = "COGNITO"


def get_or_create_user(user: CurrentUser) -> int:
    """Return users.id for the given Cognito identity, provisioning the row on first use."""
    with connection() as conn, conn.cursor() as cur:
        cur.execute("select id from users where user_id = %s", (user.sub,))
        row = cur.fetchone()
        if row:
            cur.execute(
                """update users
                       set first_name = %s, last_name = %s, recovery_email = %s,
                           last_login_at = now()
                     where id = %s""",
                (user.first_name, user.last_name, user.email or f"{user.sub}@users.noreply", row["id"]),
            )
            return row["id"]

        cur.execute(
            """insert into users
                   (first_name, last_name, user_id, password_hash, recovery_email,
                    email_verified, account_status, created_by)
               values (%s, %s, %s, %s, %s, true, 'ACTIVE', 'cognito')
               returning id""",
            (
                user.first_name,
                user.last_name,
                user.sub,
                _COGNITO_PW,
                user.email or f"{user.sub}@users.noreply",
            ),
        )
        return cur.fetchone()["id"]


# ── local accounts (APP_AUTH_MODE=local) ──────────────────────────────────
def _role_id(cur, role_name: str) -> int | None:
    cur.execute(
        "insert into roles (role_name, created_by) values (%s, 'local-auth') "
        "on conflict (role_name) do nothing",
        (role_name,),
    )
    cur.execute("select id from roles where role_name = %s", (role_name,))
    row = cur.fetchone()
    return row["id"] if row else None


def get_local_user_by_login(login: str) -> dict | None:
    """Look a local account up by its login id (email) or recovery email."""
    login = (login or "").strip().lower()
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """select u.*, coalesce(
                       (select r.role_name from user_roles ur
                          join roles r on r.id = ur.role_id
                         where ur.user_id = u.id
                         order by ur.created_at limit 1), 'parent') as role
                 from users u
                where lower(u.user_id) = %s or lower(u.recovery_email) = %s
                limit 1""",
            (login, login),
        )
        return cur.fetchone()


def create_local_user(
    *,
    first_name: str,
    last_name: str,
    email: str,
    phone: str | None,
    password_hash: str,
    role: str,
    security_questions: list[dict] | None = None,
) -> dict:
    """Create an ACTIVE local account, link its role, store security Q&A."""
    email = email.strip().lower()
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """insert into users
                   (first_name, last_name, user_id, password_hash, recovery_email,
                    recovery_phone, email_verified, account_status, created_by, updated_by)
               values (%s, %s, %s, %s, %s, %s, false, 'ACTIVE', 'local-auth', 'local-auth')
               returning *""",
            (first_name, last_name, email, password_hash, email, phone or None),
        )
        row = cur.fetchone()

        role_id = _role_id(cur, role)
        if role_id is not None:
            cur.execute(
                "insert into user_roles (user_id, role_id, created_by) values (%s, %s, 'local-auth') "
                "on conflict do nothing",
                (row["id"], role_id),
            )

        for q in security_questions or []:
            text = (q.get("question") or "").strip()
            answer_hash = q.get("answer_hash")
            if not text or not answer_hash:
                continue
            cur.execute(
                "insert into security_questions (question_text, created_by) values (%s, 'local-auth') "
                "on conflict (question_text) do nothing",
                (text,),
            )
            cur.execute("select id from security_questions where question_text = %s", (text,))
            sq = cur.fetchone()
            if sq:
                cur.execute(
                    """insert into user_security_questions
                           (user_id, security_question_id, answer_hash, created_by)
                       values (%s, %s, %s, 'local-auth')""",
                    (row["id"], sq["id"], answer_hash),
                )

        row["role"] = role
        return row


def touch_local_login(user_row_id: int) -> None:
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "update users set last_login_at = now(), failed_login_attempts = 0 where id = %s",
            (user_row_id,),
        )


def _reference_code() -> str:
    now = datetime.now(timezone.utc)
    return f"NDCS-{now.year}-{now.month:02d}{now.day:02d}-{random.randint(1000, 9999)}"


def _draft_name(details: dict[str, Any] | None) -> str | None:
    """Pull the applicant-chosen application name out of a raw wizard payload."""
    try:
        name = str((details or {}).get("data", {}).get("applicationName", "")).strip()
        return name[:120] or None
    except Exception:  # noqa: BLE001
        return None


def create_application(user_id: int, details: dict[str, Any], actor: str) -> dict:
    with connection() as conn, conn.cursor() as cur:
        # Retry a couple of times on the (rare) reference_code collision.
        for _ in range(5):
            try:
                cur.execute(
                    """insert into applications
                           (reference_code, applicant_user_id, application_details,
                            application_name, application_status, created_by, updated_by)
                       values (%s, %s, %s, %s, 'DRAFT', %s, %s)
                       returning *""",
                    (_reference_code(), user_id, Jsonb(details or {}), _draft_name(details), actor, actor),
                )
                return cur.fetchone()
            except Exception as exc:  # noqa: BLE001
                if "reference_code" in str(exc):
                    conn.rollback()
                    continue
                raise
    raise RuntimeError("could not allocate a unique reference_code")


def purge_after_ccms_push(app_id: int, ccms_aplctn_id: int, actor: str) -> dict | None:
    """Once an application has been committed to CCMS, that row is the system of
    record for the form data — clear it here rather than keep two copies of the
    applicant's PII. The summary columns (application_name, applicant_name,
    applicant_type, service_type, child_count, reference_code, submitted_at,
    applicant_user_id) are left untouched, so the applicant's Applications list
    still has something to show even though application_details is gone.
    Only ever called for a SUBMITTED row right after a successful, non-dry-run,
    non-rollback push."""
    purge_marker = {
        "_purged": True,
        "_purgedAt": datetime.now(timezone.utc).isoformat(),
        "_reason": "pushed_to_ccms",
        "_ccmsAplctnId": ccms_aplctn_id,
    }
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """update applications
                   set application_details = %s,
                       form_snapshot       = null,
                       ccms_aplctn_id      = %s,
                       updated_by          = %s
                 where id = %s and application_status = 'SUBMITTED'
               returning id, applicant_user_id, ccms_aplctn_id""",
            (Jsonb(purge_marker), ccms_aplctn_id, actor, app_id),
        )
        return cur.fetchone()


def list_applications(user_id: int) -> list[dict]:
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """select id, reference_code, application_status, submitted_at,
                      created_at, updated_at, application_name, applicant_type,
                      service_type, applicant_name, child_count
                 from applications
                where applicant_user_id = %s
                order by updated_at desc""",
            (user_id,),
        )
        return cur.fetchall()


def get_application(app_id: int, user_id: int) -> dict | None:
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "select * from applications where id = %s and applicant_user_id = %s",
            (app_id, user_id),
        )
        return cur.fetchone()


def save_application(app_id: int, user_id: int, details: dict[str, Any], actor: str) -> dict | None:
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """update applications
                   set application_details = %s,
                       application_name    = coalesce(%s, application_name),
                       updated_by          = %s
                 where id = %s and applicant_user_id = %s
                   and application_status in ('DRAFT','REJECTED')
               returning *""",
            (Jsonb(details or {}), _draft_name(details), actor, app_id, user_id),
        )
        return cur.fetchone()


def submit_application(
    app_id: int,
    user_id: int,
    details: dict[str, Any] | None,
    agreements: list[dict],
    actor: str,
) -> dict | None:
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """select application_details from applications
                where id = %s and applicant_user_id = %s and application_status = 'DRAFT'""",
            (app_id, user_id),
        )
        current = cur.fetchone()
        if not current:
            return None

        raw = details if details is not None else current["application_details"]
        canonical = to_canonical(raw)          # de-duplicated, typed, PII-protected
        snapshot = deep_protect(raw)           # exact wizard payload, SSN/acct masked
        cols = summary_columns(canonical)

        cur.execute(
            """update applications
                   set application_details = %s,
                       form_snapshot       = %s,
                       application_status   = 'SUBMITTED',
                       submitted_at         = now(),
                       application_name     = coalesce(%s, application_name),
                       applicant_type       = %s,
                       service_type         = %s,
                       applicant_name       = %s,
                       applicant_email      = %s,
                       child_count          = %s,
                       updated_by           = %s
                 where id = %s and applicant_user_id = %s and application_status = 'DRAFT'
               returning *""",
            (
                Jsonb(canonical),
                Jsonb(snapshot),
                cols["application_name"],
                cols["applicant_type"],
                cols["service_type"],
                cols["applicant_name"],
                cols["applicant_email"],
                cols["child_count"],
                actor,
                app_id,
                user_id,
            ),
        )
        row = cur.fetchone()
        if not row:
            return None

        for item in agreements:
            cur.execute(
                """insert into application_agreements
                       (application_id, consent_item_code, accepted, body_snapshot, created_by, updated_by)
                   values (%s, %s, %s, %s, %s, %s)
                   on conflict (application_id, consent_item_code)
                   do update set accepted = excluded.accepted,
                                 body_snapshot = excluded.body_snapshot,
                                 updated_by = excluded.updated_by""",
                (
                    app_id,
                    item["consent_item_code"],
                    bool(item["accepted"]),
                    item.get("body_snapshot", ""),
                    actor,
                    actor,
                ),
            )
        return row


def withdraw_application(app_id: int, user_id: int, actor: str) -> dict | None:
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """update applications
                   set application_status = 'WITHDRAWN', updated_by = %s
                 where id = %s and applicant_user_id = %s
                   and application_status not in ('WITHDRAWN','APPROVED')
               returning *""",
            (actor, app_id, user_id),
        )
        return cur.fetchone()


def get_agreements(app_id: int, user_id: int) -> list[dict]:
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """select a.consent_item_code, a.accepted, a.body_snapshot, a.created_at
                 from application_agreements a
                 join applications ap on ap.id = a.application_id
                where a.application_id = %s and ap.applicant_user_id = %s
                order by a.id""",
            (app_id, user_id),
        )
        return cur.fetchall()

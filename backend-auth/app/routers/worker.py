"""Worker: push one submitted application into the CCMS csa_portal schema.

    POST /worker/applications/{id}/push            -> writes to CCMS_DATABASE_URL
    POST /worker/applications/{id}/push?dryRun=true -> returns the insert plan, writes nothing
    POST /worker/applications/{id}/payload         -> just the constructed payload

Target DB is CCMS_DATABASE_URL (the local clone `ccms_local` for now). Never the
live RDS until the client confirms live-vs-_wp.

Option A scope: aplctn + persons (+ roles, cp/ncp/child detail, addresses,
contacts, employers, income, NCP military/jail). Support orders, financial
accounts, property, case + work_item are carried in payload["unmapped"] only.
"""
from __future__ import annotations

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from .. import ccms_mapper, ccms_writer, repository
from ..config import CCMS_CREATED_BY, CCMS_DATABASE_URL
from ..db import fetch_one
from ..normalize import to_canonical
from ..security import CurrentUser, get_current_user

router = APIRouter(prefix="/worker", tags=["worker"])


def _load_application(app_id: int) -> dict:
    row = fetch_one(
        "select id, reference_code, application_status, application_details, "
        "form_snapshot, submitted_at, created_at, ccms_aplctn_id "
        "from applications where id = %s",
        (app_id,),
    )
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found.")
    return row


def _is_purged(row: dict) -> bool:
    """True once purge_after_ccms_push() has already cleared this row's form
    data (see repository.purge_after_ccms_push) — there is nothing left here to
    build a payload from."""
    details = row.get("application_details")
    return isinstance(details, dict) and details.get("_purged") is True


def _require_not_purged(row: dict) -> None:
    if _is_purged(row):
        raise HTTPException(
            status.HTTP_410_GONE,
            "This application's form data was purged from our database after it was "
            f"successfully pushed to CCMS as csa_portal.aplctn id {row.get('ccms_aplctn_id')}. "
            "There is nothing left here to rebuild a payload from.",
        )


def _canonical(row: dict) -> dict:
    details = row.get("application_details") or {}
    # A DRAFT stores the raw wizard payload ({data, details, ...}); SUBMITTED
    # stores the already-canonical doc. Normalise the raw shape on the fly.
    if isinstance(details, dict) and "data" in details:
        return to_canonical(details)
    return details


def _iso_date(v) -> str | None:
    if isinstance(v, datetime):
        return v.date().isoformat()
    if isinstance(v, date):
        return v.isoformat()
    return str(v)[:10] if v else None


def _meta(row: dict, dry_run: bool) -> dict:
    submitted = _iso_date(row.get("submitted_at")) or _iso_date(datetime.now(timezone.utc))
    return {
        "sourceApplicationId": row["id"],
        "sourceReferenceCode": row.get("reference_code"),
        "submittedAt": (row.get("submitted_at") or datetime.now(timezone.utc)).isoformat()
        if row.get("submitted_at") else datetime.now(timezone.utc).isoformat(),
        "submittedDate": submitted,
        "startDate": _iso_date(row.get("created_at")),
        "createdBy": CCMS_CREATED_BY,
        "dryRun": dry_run,
    }


@router.post("/applications/{app_id}/payload")
def build_payload(app_id: int, user: CurrentUser = Depends(get_current_user)):
    row = _load_application(app_id)
    _require_not_purged(row)
    return ccms_mapper.build_payload(_canonical(row), _meta(row, dry_run=True))


@router.post("/applications/{app_id}/push")
def push_application(
    app_id: int,
    dry_run: bool = Query(True, alias="dryRun"),
    rollback: bool = Query(False, alias="rollback"),
    force: bool = Query(False, alias="force"),
    user: CurrentUser = Depends(get_current_user),
):
    row = _load_application(app_id)
    if row["application_status"] != "SUBMITTED":
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Application is '{row['application_status']}', not SUBMITTED — nothing to push.",
        )
    _require_not_purged(row)  # a prior successful push already cleared the source data

    already = row.get("ccms_aplctn_id")
    committing = not dry_run and not rollback
    if already and committing and not force:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Already pushed as csa_portal.aplctn id {already}. "
            f"Pass ?force=true to soft-delete that one and push again.",
        )

    payload = ccms_mapper.build_payload(_canonical(row), _meta(row, dry_run))

    try:
        if already and committing and force:
            ccms_writer.soft_delete_aplctn(already)
        outcome = ccms_writer.push(payload, dry_run=dry_run, rollback=rollback)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"CCMS write failed ({CCMS_DATABASE_URL.rsplit('@', 1)[-1]}): {exc}",
        ) from exc

    if not dry_run and not rollback:
        ccms_id = (outcome.get("result") or {}).get("aplctn", {}).get("id")
        if ccms_id:
            # CCMS is now the system of record for this application's form data —
            # store the CCMS id against the submitting user's row and clear the
            # JSONB here rather than keep two copies. Summary columns (name,
            # applicant, child count, reference code, submitted_at) are left in
            # place so the Applications list still has something to show.
            repository.purge_after_ccms_push(app_id, ccms_id, CCMS_CREATED_BY)

    return {"payload": payload, "outcome": outcome}

"""Local account auth (APP_AUTH_MODE=local).

Accounts live in the `users` table. Registration creates an ACTIVE account and
returns a signed HS256 JWT; login verifies the bcrypt password hash and returns
the same. The token is what /applications expects as its bearer token.

Cognito registration/login (routers/cognito.py) stays available; the frontend
picks a provider via NEXT_PUBLIC_AUTH_PROVIDER.
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from .. import config, repository
from ..passwords import hash_secret, normalize_answer, verify_secret

router = APIRouter(prefix="/auth", tags=["auth"])

ROLES = {"parent", "provider"}
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _clean_email(value: str) -> str:
    email = (value or "").strip().lower()
    if not _EMAIL_RE.match(email):
        raise ValueError("Enter a valid email address.")
    return email


class SecurityQAInput(BaseModel):
    question: str
    answer: str


class RegisterRequest(BaseModel):
    first_name: str = Field(alias="firstName", min_length=1, max_length=100)
    last_name: str = Field(alias="lastName", min_length=1, max_length=100)
    email: str
    password: str = Field(min_length=8, max_length=200)
    role: str = "parent"
    phone: str | None = Field(default=None, alias="phone")
    security_questions: list[SecurityQAInput] = Field(default_factory=list, alias="securityQuestions")

    model_config = {"populate_by_name": True}

    @field_validator("email")
    @classmethod
    def _v_email(cls, v: str) -> str:
        return _clean_email(v)


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _v_email(cls, v: str) -> str:
        return _clean_email(v)


class AuthUser(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str


class AuthResponse(BaseModel):
    token: str
    user: AuthUser


def _mint_token(row: dict, role: str) -> str:
    now = datetime.now(timezone.utc)
    email = row["recovery_email"]
    claims = {
        "sub": row["user_id"],
        "uid": row["id"],
        "email": email,
        "given_name": row["first_name"],
        "family_name": row["last_name"],
        "name": f"{row['first_name']} {row['last_name']}".strip(),
        "role": role,
        "custom:role": role,
        "token_use": "id",
        "iat": now,
        "exp": now + timedelta(hours=config.LOCAL_JWT_TTL_HOURS),
    }
    return jwt.encode(claims, config.LOCAL_JWT_SECRET, algorithm="HS256")


def _auth_response(row: dict, role: str) -> AuthResponse:
    return AuthResponse(
        token=_mint_token(row, role),
        user=AuthUser(
            id=row["id"],
            first_name=row["first_name"],
            last_name=row["last_name"],
            email=row["recovery_email"],
            role=role,
        ),
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    if config.APP_AUTH_MODE != "local":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Local registration is disabled (APP_AUTH_MODE is not 'local').")

    role = body.role if body.role in ROLES else "parent"
    email = body.email.strip().lower()

    if repository.get_local_user_by_login(email):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with that email address already exists.")

    security_questions = [
        {"question": q.question.strip(), "answer_hash": hash_secret(normalize_answer(q.answer))}
        for q in body.security_questions
        if q.question.strip() and q.answer.strip()
    ]

    try:
        row = repository.create_local_user(
            first_name=body.first_name.strip(),
            last_name=body.last_name.strip(),
            email=email,
            phone=(body.phone or "").strip() or None,
            password_hash=hash_secret(body.password),
            role=role,
            security_questions=security_questions,
        )
    except Exception as exc:  # noqa: BLE001
        msg = str(exc)
        if "recovery_email" in msg or "user_id" in msg:
            raise HTTPException(status.HTTP_409_CONFLICT, "An account with that email address already exists.")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not create the account.") from exc

    return _auth_response(row, role)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    if config.APP_AUTH_MODE != "local":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Local login is disabled (APP_AUTH_MODE is not 'local').")

    row = repository.get_local_user_by_login(body.email)
    if not row or row.get("password_hash") in (None, "", "COGNITO"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    if not verify_secret(body.password, row["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    if row.get("account_status") == "DISABLED":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been disabled.")
    if row.get("account_status") == "LOCKED":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is locked. Contact an administrator.")

    repository.touch_local_login(row["id"])
    return _auth_response(row, row.get("role") or "parent")

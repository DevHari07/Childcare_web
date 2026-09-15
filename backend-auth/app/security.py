"""Resolve the current user from a Cognito ID token (or a dev fallback)."""
from __future__ import annotations

from dataclasses import dataclass

import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt import PyJWKClient

from . import config

_ISSUER = (
    f"https://cognito-idp.{config.AWS_REGION}.amazonaws.com/{config.COGNITO_USER_POOL_ID}"
    if config.COGNITO_USER_POOL_ID
    else ""
)
_jwk_client: PyJWKClient | None = None


def _jwks() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient(f"{_ISSUER}/.well-known/jwks.json")
    return _jwk_client


@dataclass
class CurrentUser:
    sub: str
    email: str
    first_name: str
    last_name: str
    name: str


def _split_name(name: str) -> tuple[str, str]:
    parts = (name or "").strip().split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def _claims_to_user(claims: dict) -> CurrentUser:
    given = (claims.get("given_name") or "").strip()
    family = (claims.get("family_name") or "").strip()
    name = (claims.get("name") or f"{given} {family}").strip()
    if not given and not family:
        given, family = _split_name(name)
    return CurrentUser(
        sub=claims["sub"],
        email=(claims.get("email") or "").strip().lower(),
        first_name=given or "Applicant",
        last_name=family or "User",
        name=name or "Applicant User",
    )


def verify_cognito_jwt(token: str) -> dict:
    if not config.COGNITO_USER_POOL_ID or not config.COGNITO_APP_CLIENT_ID:
        raise HTTPException(500, "Cognito pool/client id not configured for the backend.")
    try:
        signing_key = _jwks().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=config.COGNITO_APP_CLIENT_ID,
            issuer=_ISSUER,
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {exc}") from exc
    if claims.get("token_use") != "id":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Expected a Cognito ID token.")
    return claims


def verify_local_jwt(token: str) -> dict:
    """Verify a token minted by the local /auth endpoints (HS256 + LOCAL_JWT_SECRET)."""
    try:
        claims = jwt.decode(
            token,
            config.LOCAL_JWT_SECRET,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {exc}") from exc
    return claims


def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    if config.APP_AUTH_MODE == "cognito":
        if not token:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authorization bearer token required.")
        return _claims_to_user(verify_cognito_jwt(token))

    if config.APP_AUTH_MODE == "local":
        if not token:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authorization bearer token required.")
        return _claims_to_user(verify_local_jwt(token))

    # dev mode: trust the token's claims without verifying its signature,
    # or fall back to the configured dev user when no token is present.
    if token:
        try:
            claims = jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False, "verify_exp": False},
            )
            if claims.get("sub"):
                return _claims_to_user(claims)
        except jwt.PyJWTError:
            pass
    return CurrentUser(
        sub=config.DEV_USER_SUB,
        email=config.DEV_USER_EMAIL.lower(),
        first_name=_split_name(config.DEV_USER_NAME)[0] or "Dev",
        last_name=_split_name(config.DEV_USER_NAME)[1] or "User",
        name=config.DEV_USER_NAME,
    )


CurrentUserDep = Depends(get_current_user)

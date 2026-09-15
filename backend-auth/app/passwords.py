"""Password / security-answer hashing for local accounts (APP_AUTH_MODE=local).

bcrypt silently truncates input past 72 bytes, so every secret is first folded
to a fixed-length SHA-256 digest (base64) before hashing.
"""
from __future__ import annotations

import base64
import hashlib

import bcrypt


def _prehash(raw: str) -> bytes:
    return base64.b64encode(hashlib.sha256(raw.encode("utf-8")).digest())


def hash_secret(raw: str) -> str:
    return bcrypt.hashpw(_prehash(raw), bcrypt.gensalt()).decode("ascii")


def verify_secret(raw: str, hashed: str) -> bool:
    if not raw or not hashed:
        return False
    try:
        return bcrypt.checkpw(_prehash(raw), hashed.encode("ascii"))
    except ValueError:
        return False


def normalize_answer(answer: str) -> str:
    """Security answers compare case-insensitively, trimmed."""
    return " ".join((answer or "").strip().lower().split())

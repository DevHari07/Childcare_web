"""PII protection for values that must be persisted (SSN, financial account numbers).

Policy:
  * We store as little as possible — an SSN becomes {"last4": "6789"}.
  * If APP_ENCRYPTION_KEY is set, we ALSO keep {"cipher": "<fernet token>"} so an
    authorised process can recover the full value; otherwise only last4 is kept.
  * The full plaintext value is never returned by the API.

Generate a key once:  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""
from __future__ import annotations

import re
from typing import Any

from .config import APP_ENCRYPTION_KEY

try:
    from cryptography.fernet import Fernet, InvalidToken
except Exception:  # pragma: no cover - cryptography ships with pyjwt[crypto]
    Fernet = None  # type: ignore
    InvalidToken = Exception  # type: ignore

_fernet = Fernet(APP_ENCRYPTION_KEY.encode()) if (APP_ENCRYPTION_KEY and Fernet) else None

# JSON keys whose string values are treated as SSNs / account numbers.
_SSN_KEYS = {"ssn"}
_ACCT_KEYS = {"accountnumber", "account_number"}


def encryption_enabled() -> bool:
    return _fernet is not None


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def protect_ssn(value: str) -> dict | None:
    d = _digits(value)
    if not d:
        return None
    out: dict[str, Any] = {"last4": d[-4:]}
    if _fernet:
        out["cipher"] = _fernet.encrypt(d.encode()).decode()
    return out


def protect_account(value: str) -> dict | None:
    raw = (value or "").strip()
    if not raw:
        return None
    out: dict[str, Any] = {"last4": raw[-4:]}
    if _fernet:
        out["cipher"] = _fernet.encrypt(raw.encode()).decode()
    return out


def reveal(protected: Any) -> str | None:
    """Recover a full value from a {'cipher': ...} envelope (server-side use only)."""
    if not isinstance(protected, dict) or "cipher" not in protected or not _fernet:
        return None
    try:
        return _fernet.decrypt(protected["cipher"].encode()).decode()
    except InvalidToken:
        return None


def deep_protect(obj: Any) -> Any:
    """Walk a nested dict/list and replace SSN / account-number string values in place."""
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            kl = k.lower()
            if kl in _SSN_KEYS and isinstance(v, str):
                out[k] = protect_ssn(v)
            elif kl in _ACCT_KEYS and isinstance(v, str):
                out[k] = protect_account(v)
            else:
                out[k] = deep_protect(v)
        return out
    if isinstance(obj, list):
        return [deep_protect(v) for v in obj]
    return obj

"""Connection pool for the CCMS target database (csa_portal schema).

Separate from db.py — that pool is our own application DB, this one is the
client's CCMS DB (`CCMS_DATABASE_URL`, currently the local clone `ccms_local`).
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import CCMS_DATABASE_URL

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            conninfo=CCMS_DATABASE_URL,
            min_size=0,
            max_size=4,
            kwargs={"row_factory": dict_row, "options": "-c search_path=csa_portal,csa_common,public"},
            open=True,
        )
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def connection() -> Iterator[Any]:
    """A pooled CCMS connection; commits on success, rolls back on error."""
    with get_pool().connection() as conn:
        yield conn

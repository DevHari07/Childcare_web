"""Create the application database, run schema.sql + seed.sql.

    python init_db.py            # create db (if needed) + schema + seed
    python init_db.py --reset    # DROP and recreate every table first
"""
import sys
from pathlib import Path
from urllib.parse import urlsplit

import psycopg

from app.config import DATABASE_URL, POSTGRES_ADMIN_URL

HERE = Path(__file__).parent
SCHEMA = (HERE / "db" / "schema.sql").read_text(encoding="utf-8")
SEED = (HERE / "db" / "seed.sql").read_text(encoding="utf-8")

TABLES = [
    "application_agreements", "applications", "user_roles", "user_activation_codes",
    "user_security_questions", "roles", "security_questions", "users", "state",
]


def db_name(dsn: str) -> str:
    return urlsplit(dsn).path.lstrip("/") or "postgres"


def ensure_database() -> None:
    name = db_name(DATABASE_URL)
    with psycopg.connect(POSTGRES_ADMIN_URL, autocommit=True) as conn:
        exists = conn.execute("select 1 from pg_database where datname = %s", (name,)).fetchone()
        if exists:
            print(f"database '{name}' already exists")
            return
        conn.execute(f'create database "{name}"')
        print(f"created database '{name}'")


def main() -> None:
    reset = "--reset" in sys.argv
    ensure_database()
    with psycopg.connect(DATABASE_URL, autocommit=True) as conn:
        if reset:
            for t in TABLES:
                conn.execute(f'drop table if exists "{t}" cascade')
            print(f"dropped {len(TABLES)} tables")
        conn.execute(SCHEMA)
        print("schema.sql applied")
        conn.execute(SEED)
        print("seed.sql applied")

        counts = conn.execute(
            "select relname, n_live_tup from pg_stat_user_tables order by relname"
        ).fetchall()
        for name, n in counts:
            print(f"  {name:<28} {n}")
    print("done.")


if __name__ == "__main__":
    main()

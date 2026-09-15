"""Environment configuration for the backend (auth + applications)."""
import os

from dotenv import load_dotenv

# Load backend-auth/.env (one level up from this package).
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── Cognito (auth) ─────────────────────────────────────────────────────────
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "")
COGNITO_DEFAULT_GROUP = os.getenv("COGNITO_DEFAULT_GROUP", "User")
COGNITO_ROLE_ATTRIBUTE = os.getenv("COGNITO_ROLE_ATTRIBUTE", "").strip()

# ── Database ──────────────────────────────────────────────────────────────
# Full DSN for the application database.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:TEST@localhost:5432/childcare"
)
# DSN for the maintenance DB, used once by init_db.py to CREATE DATABASE.
POSTGRES_ADMIN_URL = os.getenv(
    "POSTGRES_ADMIN_URL", "postgresql://postgres:TEST@localhost:5432/postgres"
)

# ── CCMS worker ───────────────────────────────────────────────────────────
# Target DB for POST /worker/applications/{id}/push (the client's csa_portal
# schema). Defaults to the LOCAL CLONE `ccms_local` — never point this at the
# live RDS without the client's go-ahead.
CCMS_DATABASE_URL = os.getenv(
    "CCMS_DATABASE_URL", "postgresql://postgres:TEST@localhost:5432/ccms_local"
)
# Value stamped into created_by / updated_by on every row the worker writes.
CCMS_CREATED_BY = os.getenv("CCMS_CREATED_BY", "CSA_PORTAL")

# ── App auth mode ─────────────────────────────────────────────────────────
#   "cognito" — every /applications call must present a valid Cognito ID token.
#   "local"   — accounts live in the local `users` table; /auth/register and
#               /auth/login issue an HS256 JWT signed with LOCAL_JWT_SECRET,
#               and every /applications call must present that token.
#   "dev"     — the token's claims are read WITHOUT signature verification;
#               if no token is sent, DEV_USER_* below is assumed. Local use only.
APP_AUTH_MODE = os.getenv("APP_AUTH_MODE", "local").strip().lower()
DEV_USER_SUB = os.getenv("DEV_USER_SUB", "dev-user-0001")
DEV_USER_EMAIL = os.getenv("DEV_USER_EMAIL", "dev@example.com")
DEV_USER_NAME = os.getenv("DEV_USER_NAME", "Dev User")

# ── Local auth (APP_AUTH_MODE=local) ──────────────────────────────────────
LOCAL_JWT_SECRET = os.getenv("LOCAL_JWT_SECRET", "dev-only-change-me-local-jwt-secret")
LOCAL_JWT_TTL_HOURS = int(os.getenv("LOCAL_JWT_TTL_HOURS", "12"))

# ── PII encryption ───────────────────────────────────────────────────────
# Fernet key; when set, SSN / account numbers in the submitted record are also
# kept encrypted (alongside last-4). Unset -> only last-4 is stored.
APP_ENCRYPTION_KEY = os.getenv("APP_ENCRYPTION_KEY", "").strip()

# ── CORS ─────────────────────────────────────────────────────────────────
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

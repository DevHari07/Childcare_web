"""Childcare backend — Cognito auth admin + child support applications API."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import ccms_db, config
from .db import close_pool, fetch_one, get_pool
from .routers import applications, auth, cognito, worker


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_pool()  # open the DB pool eagerly so a bad DSN fails fast
    yield
    close_pool()
    ccms_db.close_pool()


app = FastAPI(title="Childcare Backend", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    # localhost/127.0.0.1 at any port, plus VS Code / GitHub dev tunnels
    # (https://<id>-<port>.<region>.devtunnels.ms) so the frontend can be
    # opened from a forwarded tunnel URL instead of localhost.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?|https://[a-z0-9-]+(\.[a-z0-9-]+)*\.devtunnels\.ms",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cognito.router)
app.include_router(applications.router)
app.include_router(worker.router)


@app.get("/")
def read_root():
    db_ok = False
    try:
        db_ok = fetch_one("select 1 as ok") is not None
    except Exception as exc:  # noqa: BLE001
        print(f"DB health check failed: {exc}")
    return {
        "status": "online",
        "service": "Childcare Backend (auth + applications)",
        "region": config.AWS_REGION,
        "cognito_pool_configured": bool(config.COGNITO_USER_POOL_ID),
        "app_auth_mode": config.APP_AUTH_MODE,
        "database_connected": db_ok,
    }

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import select, text
from sqlalchemy.exc import OperationalError

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import User
from app.routers import admin, auth, jobs, media, menus, mux_webhook, onboarding, playlist, public_display, screens
from app.services.r2_storage import check_r2_connection

limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger("kemisdisplay")

app = FastAPI(title="KemisDisplay API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(settings.menu_render_tmp).mkdir(parents=True, exist_ok=True)

app.mount("/files", StaticFiles(directory=settings.upload_dir), name="files")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(screens.router, prefix="/screens", tags=["screens"])
app.include_router(playlist.router, prefix="/screens", tags=["playlist"])
app.include_router(media.router, prefix="/media", tags=["media"])
app.include_router(public_display.router, prefix="/public", tags=["public"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(menus.router, prefix="/menus", tags=["menus"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(mux_webhook.router, prefix="/mux", tags=["mux"])
app.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])


def bootstrap_admins() -> None:
    emails = settings.admin_email_list
    if not emails:
        return
    db = SessionLocal()
    try:
        changed = 0
        for email in emails:
            u = db.scalar(select(User).where(User.email == email))
            if u and not u.is_admin:
                u.is_admin = True
                changed += 1
        db.commit()
        if changed:
            logger.info("Granted admin to %s user(s) (ADMIN_EMAILS).", changed)
    except Exception as e:
        logger.warning("bootstrap_admins failed: %s", e)
        db.rollback()
    finally:
        db.close()


@app.exception_handler(OperationalError)
async def database_unavailable_handler(
    request: Request,
    exc: OperationalError,
) -> JSONResponse:
    logger.error(
        "Database unavailable on %s %s: %s",
        request.method,
        request.url.path,
        exc.orig if hasattr(exc, "orig") and exc.orig else exc,
    )
    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "Database unavailable. Start PostgreSQL — from the project root run: "
                "docker compose up -d (port 5434). If Docker fails to pull the image, "
                "run: docker pull postgres:16-alpine"
            )
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except OperationalError as e:
        logger.warning("Health check: database down: %s", e)
        return {
            "status": "degraded",
            "database": "unavailable",
            "hint": "Start Postgres: docker compose up -d (see README).",
        }
    result: dict[str, str] = {"status": "ok", "database": "ok"}
    r2 = check_r2_connection()
    result["r2"] = r2["status"]
    if r2["status"] == "error":
        result["status"] = "degraded"
        result["r2_detail"] = r2["detail"]
    return result


@app.on_event("startup")
def startup() -> None:
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema ensured (create_all).")
        bootstrap_admins()
    except OperationalError as e:
        logger.error(
            "Could not reach PostgreSQL at startup. API will return 503 on DB routes until "
            "the database is running. Error: %s",
            e.orig if hasattr(e, "orig") and e.orig else e,
        )

    if settings.r2_enabled:
        r2 = check_r2_connection()
        if r2["status"] == "ok":
            logger.info("R2 connectivity OK (bucket: %s)", r2.get("bucket"))
        else:
            logger.error("R2 connectivity FAILED at startup: %s", r2.get("detail"))
    else:
        logger.info("R2 storage not configured (videos will use Mux or local disk).")

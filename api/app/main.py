import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select, text
from sqlalchemy.exc import OperationalError

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import User
from app.routers import admin, auth, jobs, media, menus, mux_webhook, playlist, public_display, screens

logger = logging.getLogger("kemisdisplay")

app = FastAPI(title="KemisDisplay API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return {"status": "ok", "database": "ok"}


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

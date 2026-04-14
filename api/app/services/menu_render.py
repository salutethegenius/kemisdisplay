"""Playwright + FFmpeg: menu HTML -> 30s H.264 MP4."""

import logging
import shutil
import subprocess
import threading
import uuid as uuid_lib
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from app.config import settings
from app.models import Media, Menu, RenderJob
from app.services.menu_html import build_chalkboard_html
from app.services.mux_video import ingest_local_video_file
from app.services.video_probe import probe_video_duration_seconds

logger = logging.getLogger("kemisdisplay")

_RENDER_SEM = threading.BoundedSemaphore(1)


def try_acquire_render_slot() -> bool:
    return _RENDER_SEM.acquire(blocking=False)


def release_render_slot() -> None:
    try:
        _RENDER_SEM.release()
    except ValueError:
        pass


def run_menu_render_job(job_id: UUID) -> None:
    """Background worker: owns DB session and always releases semaphore."""
    from app.database import SessionLocal

    db = SessionLocal()
    tmp_root = Path(settings.menu_render_tmp).expanduser()
    tmp_root.mkdir(parents=True, exist_ok=True)
    # Playwright needs file:// URIs; pathlib.as_uri() requires absolute paths.
    tmp_root = tmp_root.resolve()
    job_dir = tmp_root / str(job_id)
    job_dir.mkdir(parents=True, exist_ok=True)
    webm_path: Path | None = None
    mp4_path = job_dir / "out.mp4"

    try:
        job = db.get(RenderJob, job_id)
        if not job:
            return
        menu = db.get(Menu, job.menu_id)
        if not menu:
            job.status = "failed"
            job.error_message = "Menu not found"
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            return

        job.status = "processing"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        html = build_chalkboard_html(menu)
        html_path = job_dir / "menu.html"
        html_path.write_text(html, encoding="utf-8")

        try:
            from playwright.sync_api import sync_playwright
        except ImportError as e:
            job.status = "failed"
            job.error_message = "Playwright not installed on server."
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            logger.error("playwright missing: %s", e)
            return

        if not shutil.which("ffmpeg"):
            job.status = "failed"
            job.error_message = "ffmpeg not found on PATH."
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            return

        video_dir = job_dir / "cap"
        video_dir.mkdir(exist_ok=True)

        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            context = browser.new_context(
                viewport={"width": 1920, "height": 1080},
                record_video_dir=str(video_dir),
                record_video_size={"width": 1920, "height": 1080},
            )
            page = context.new_page()
            page.goto(html_path.as_uri(), wait_until="networkidle", timeout=120_000)
            page.wait_for_timeout(30_000)
            context.close()
            browser.close()

        vids = list(video_dir.glob("*.webm"))
        if not vids:
            job.status = "failed"
            job.error_message = "No WebM produced by Playwright."
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            return
        webm_path = vids[0]

        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(webm_path),
            "-t",
            "30",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(mp4_path),
        ]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if r.returncode != 0:
            job.status = "failed"
            job.error_message = (r.stderr or r.stdout or "ffmpeg failed")[:2000]
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            logger.error("ffmpeg: %s", job.error_message)
            return

        if not mp4_path.is_file():
            job.status = "failed"
            job.error_message = "MP4 missing after ffmpeg."
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            return

        size = mp4_path.stat().st_size
        dur = probe_video_duration_seconds(mp4_path) or 30

        if settings.mux_enabled:
            media = Media(
                user_id=job.user_id,
                filename=f"menu-{menu.id}.mp4",
                file_url="",
                type="video",
                duration_seconds=int(round(dur)),
                size_bytes=size,
                mux_status="processing",
            )
            db.add(media)
            db.flush()
            try:
                ingest_local_video_file(mp4_path, media.id)
            except Exception as e:
                db.rollback()
                job = db.get(RenderJob, job_id)
                if job:
                    job.status = "failed"
                    job.error_message = (str(e) or "Mux ingest failed")[:2000]
                    job.updated_at = datetime.now(timezone.utc)
                    db.commit()
                logger.error("menu render mux ingest: %s", e)
                return
        else:
            uid = uuid_lib.uuid4()
            disk_name = f"{uid}.mp4"
            user_dir = Path(settings.upload_dir) / str(job.user_id)
            user_dir.mkdir(parents=True, exist_ok=True)
            dest = user_dir / disk_name
            shutil.copy2(mp4_path, dest)
            base = settings.public_api_base_url.rstrip("/")
            public_url = f"{base}/files/{job.user_id}/{disk_name}"
            media = Media(
                user_id=job.user_id,
                filename=f"menu-{menu.id}.mp4",
                file_url=public_url,
                type="video",
                duration_seconds=int(round(dur)),
                size_bytes=size,
            )
            db.add(media)
            db.flush()

        job.media_id = media.id
        job.status = "succeeded"
        job.error_message = None
        job.updated_at = datetime.now(timezone.utc)
        db.commit()
        logger.info("Menu render job %s -> media %s", job_id, media.id)

    except Exception as e:
        logger.exception("render job %s", job_id)
        job = db.get(RenderJob, job_id)
        if job:
            job.status = "failed"
            job.error_message = str(e)[:2000]
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        try:
            shutil.rmtree(job_dir, ignore_errors=True)
        except OSError:
            pass
        db.close()
        release_render_slot()

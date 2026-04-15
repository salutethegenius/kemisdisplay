"""Route videos to R2 (small), Mux (large / no R2), or local disk."""

from __future__ import annotations

import logging
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

from app.config import settings
from app.services.mux_video import delete_mux_asset, ingest_local_video_file
from app.services.r2_storage import delete_from_r2, upload_to_r2
from app.services.video_probe import probe_video_duration_seconds
from app.services.video_utils import generate_thumbnail

logger = logging.getLogger("kemisdisplay")


def _video_content_type(path: Path) -> str:
    ext = path.suffix.lower()
    return {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
    }.get(ext, "application/octet-stream")


@dataclass
class VideoProcessResult:
    storage_provider: str  # r2 | mux | local
    status: str  # ready | processing
    file_url: str | None = None
    thumbnail_url: str | None = None
    duration_seconds: int | None = None
    r2_key: str | None = None
    r2_thumbnail_key: str | None = None


def _size_mb(path: Path) -> float:
    return path.stat().st_size / (1024 * 1024)


def process_video(file_path: str | Path, media_id: UUID, user_id: UUID) -> VideoProcessResult:
    path = Path(file_path).expanduser().resolve()
    if not path.is_file():
        raise FileNotFoundError(str(path))

    mb = _size_mb(path)
    threshold = settings.video_mux_threshold_mb
    logger.info(
        "Video %s: %.2f MB (threshold %s MB)",
        media_id,
        mb,
        threshold,
    )

    if mb <= threshold and settings.r2_enabled:
        return _process_via_r2(path, media_id)
    if settings.mux_enabled:
        return _process_via_mux(path, media_id)
    return _process_via_local(path, user_id)


def _process_via_r2(path: Path, media_id: UUID) -> VideoProcessResult:
    ext = path.suffix.lower() or ".mp4"
    video_key = f"videos/{media_id}{ext}"
    ctype = _video_content_type(path)
    file_url = upload_to_r2(str(path), video_key, content_type=ctype)

    thumb_key: str | None = None
    thumbnail_url: str | None = None
    thumb_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            thumb_path = tmp.name
        if generate_thumbnail(path, thumb_path):
            thumb_key = f"thumbnails/{media_id}.jpg"
            thumbnail_url = upload_to_r2(thumb_path, thumb_key, content_type="image/jpeg")
    finally:
        if thumb_path and os.path.exists(thumb_path):
            os.unlink(thumb_path)

    dur_f = probe_video_duration_seconds(path)
    duration = int(round(dur_f)) if dur_f is not None else None

    return VideoProcessResult(
        storage_provider="r2",
        status="ready",
        file_url=file_url,
        thumbnail_url=thumbnail_url,
        duration_seconds=duration,
        r2_key=video_key,
        r2_thumbnail_key=thumb_key,
    )


def _process_via_mux(path: Path, media_id: UUID) -> VideoProcessResult:
    ingest_local_video_file(path, media_id)
    logger.info("Video %s sent to Mux", media_id)
    return VideoProcessResult(
        storage_provider="mux",
        status="processing",
    )


def _process_via_local(path: Path, user_id: UUID) -> VideoProcessResult:
    base = settings.public_api_base_url.rstrip("/")
    file_url = f"{base}/files/{user_id}/{path.name}"
    dur_f = probe_video_duration_seconds(path)
    duration = int(round(dur_f)) if dur_f is not None else None
    return VideoProcessResult(
        storage_provider="local",
        status="ready",
        file_url=file_url,
        duration_seconds=duration,
    )


def delete_stored_video(media) -> None:
    """Remove bytes from R2, Mux, or local upload dir based on storage_provider."""
    if media.r2_key or media.storage_provider == "r2":
        if media.r2_key:
            delete_from_r2(media.r2_key)
        if media.r2_thumbnail_key:
            delete_from_r2(media.r2_thumbnail_key)
        return
    if media.storage_provider == "mux" or media.mux_asset_id:
        if media.mux_asset_id:
            delete_mux_asset(media.mux_asset_id)
        return
    try:
        fu = media.file_url or ""
        if fu.startswith("http") and "/files/" not in fu:
            return
        suffix = Path(fu).name
        if not suffix:
            return
        path = Path(settings.upload_dir) / str(media.user_id) / suffix
        path.unlink(missing_ok=True)
    except OSError:
        pass

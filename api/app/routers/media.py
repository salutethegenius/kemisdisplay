import logging
import tempfile
import uuid as uuid_lib
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Media, User
from app.schemas import MediaOut
from app.services.limits import billing_allows_write, max_storage_bytes_for, sum_user_media_bytes
from app.services.r2_storage import upload_to_r2
from app.services.video_probe import probe_video_duration_seconds
from app.services.video_router import delete_stored_video, process_video

logger = logging.getLogger("kemisdisplay")

router = APIRouter()

ALLOWED_IMAGE = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_VIDEO = {".mp4", ".webm"}
MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB absolute ceiling


def _guess_type(filename: str) -> str | None:
    ext = Path(filename).suffix.lower()
    if ext in ALLOWED_IMAGE:
        return "image"
    if ext in ALLOWED_VIDEO:
        return "video"
    return None


def _image_content_type(ext: str) -> str:
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }.get(ext.lower(), "application/octet-stream")


@router.get("", response_model=list[MediaOut])
def list_media(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MediaOut]:
    rows = db.scalars(select(Media).where(Media.user_id == user.id).order_by(Media.created_at.desc())).all()
    return [MediaOut.model_validate(m) for m in rows]


@router.post("/upload", response_model=MediaOut)
async def upload_media(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
) -> MediaOut:
    if not billing_allows_write(user):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Trial ended or no active plan. Subscribe to continue.",
        )
    if not file.filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Filename required")
    kind = _guess_type(file.filename)
    if not kind:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Unsupported file type. Use images (jpg, png, webp, gif) or video (mp4, webm).",
        )
    data = await file.read()
    size = len(data)
    if size > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File exceeds 100 MB limit.")
    cap = max_storage_bytes_for(user)
    used = sum_user_media_bytes(db, user.id)
    if used + size > cap:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Storage quota exceeded for your plan.")

    ext = Path(file.filename).suffix.lower() or (".jpg" if kind == "image" else ".mp4")
    uid = uuid_lib.uuid4()

    duration: int | None = None
    if kind == "video":
        user_dir = Path(settings.upload_dir) / str(user.id)
        user_dir.mkdir(parents=True, exist_ok=True)
        disk_name = f"{uid}{ext}"
        path = user_dir / disk_name
        path.write_bytes(data)
        dur_f = probe_video_duration_seconds(path)
        if dur_f is not None:
            duration = int(round(dur_f))

        media = Media(
            id=uid,
            user_id=user.id,
            filename=file.filename,
            file_url="",
            type=kind,
            duration_seconds=duration,
            size_bytes=size,
        )
        db.add(media)
        db.flush()
        try:
            result = process_video(path, uid, user.id)
        except Exception as exc:
            logger.exception("Video processing failed for media %s (user %s): %s", uid, user.id, exc)
            db.rollback()
            path.unlink(missing_ok=True)
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                f"Video processing failed: {type(exc).__name__}. Check server logs for details.",
            )

        media.storage_provider = result.storage_provider
        media.thumbnail_url = result.thumbnail_url
        media.r2_key = result.r2_key
        media.r2_thumbnail_key = result.r2_thumbnail_key

        if result.storage_provider == "mux":
            media.mux_status = "processing"
            media.file_url = ""
        else:
            media.mux_status = None
            media.file_url = result.file_url or ""

        if result.duration_seconds is not None:
            media.duration_seconds = result.duration_seconds

        if result.storage_provider in ("r2", "mux"):
            path.unlink(missing_ok=True)

        db.commit()
        db.refresh(media)
        return MediaOut.model_validate(media)

    # image → R2 only (no silent disk fallback — survives Railway redeploys)
    if not settings.r2_enabled:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Image uploads require Cloudflare R2. Configure R2_ACCOUNT_ID, "
            "R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL.",
        )

    key = f"images/{uid}{ext}"
    ctype = _image_content_type(ext)
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        file_url = upload_to_r2(tmp_path, key, content_type=ctype)
    finally:
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)

    media = Media(
        id=uid,
        user_id=user.id,
        filename=file.filename,
        file_url=file_url,
        type=kind,
        duration_seconds=duration,
        size_bytes=size,
        storage_provider="r2",
        r2_key=key,
        thumbnail_url=file_url,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return MediaOut.model_validate(media)


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    media = db.get(Media, media_id)
    if not media or media.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Media not found")
    delete_stored_video(media)
    db.delete(media)
    db.commit()

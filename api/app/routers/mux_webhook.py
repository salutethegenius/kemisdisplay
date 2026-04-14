"""Mux webhook receiver (signature-verified)."""

from __future__ import annotations

import json
import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models import Media
from app.services.mux_webhook_verify import verify_mux_signature

logger = logging.getLogger("kemisdisplay")

router = APIRouter()


def _first_public_playback_id(asset: dict[str, Any]) -> str | None:
    for pid in asset.get("playback_ids") or []:
        if isinstance(pid, dict) and pid.get("policy") == "public" and pid.get("id"):
            return str(pid["id"])
    return None


def _apply_asset_ready(db: Session, data: dict[str, Any]) -> None:
    passthrough = data.get("passthrough")
    if not passthrough:
        return
    try:
        media_uuid = UUID(str(passthrough))
    except ValueError:
        logger.warning("Mux asset.ready invalid passthrough: %s", passthrough)
        return

    media = db.get(Media, media_uuid)
    if not media or media.type != "video":
        return

    asset_id = str(data.get("id") or "")
    if media.mux_asset_id == asset_id and media.mux_playback_id:
        return
    playback_id = _first_public_playback_id(data)
    if not asset_id or not playback_id:
        logger.warning("Mux asset.ready missing id or playback for media %s", media_uuid)
        return

    dur = data.get("duration")
    duration_seconds: int | None = None
    if dur is not None:
        try:
            duration_seconds = int(round(float(dur)))
        except (TypeError, ValueError):
            duration_seconds = None

    media.mux_asset_id = asset_id
    media.mux_playback_id = playback_id
    if duration_seconds is not None:
        media.duration_seconds = duration_seconds
    media.thumbnail_url = f"https://image.mux.com/{playback_id}/thumbnail.jpg"
    if media.mux_status != "failed":
        media.mux_status = "processing"


def _apply_static_rendition_ready(db: Session, data: dict[str, Any]) -> None:
    name = str(data.get("name") or "")
    if "highest" not in name.lower():
        return

    asset_id = str(data.get("asset_id") or "")
    if not asset_id:
        return

    media = db.query(Media).filter(Media.mux_asset_id == asset_id).one_or_none()
    if not media:
        logger.warning("Mux static_rendition.ready unknown asset_id=%s", asset_id)
        return

    if media.mux_status == "ready" and "stream.mux.com" in (media.file_url or ""):
        return

    playback_id = media.mux_playback_id or _first_public_playback_id(data)
    if not playback_id:
        logger.warning("Mux static_rendition.ready no playback_id for media %s", media.id)
        return

    media.mux_playback_id = playback_id
    media.file_url = f"https://stream.mux.com/{playback_id}/highest.mp4"
    if not media.thumbnail_url:
        media.thumbnail_url = f"https://image.mux.com/{playback_id}/thumbnail.jpg"
    media.mux_status = "ready"


def _apply_asset_errored(db: Session, data: dict[str, Any]) -> None:
    media: Media | None = None
    passthrough = data.get("passthrough")
    if passthrough:
        try:
            media = db.get(Media, UUID(str(passthrough)))
        except ValueError:
            media = None
    if not media:
        aid = str(data.get("id") or "")
        if aid:
            media = db.query(Media).filter(Media.mux_asset_id == aid).one_or_none()
    if not media:
        return
    media.mux_status = "failed"


@router.post("/webhook")
async def mux_webhook(request: Request) -> dict[str, str]:
    if not settings.mux_webhook_signing_secret.strip():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Mux webhook signing secret not configured",
        )

    raw = await request.body()
    sig_header = request.headers.get("Mux-Signature") or request.headers.get("mux-signature")
    try:
        verify_mux_signature(
            raw,
            sig_header,
            settings.mux_webhook_signing_secret.strip(),
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e)) from e

    try:
        payload: dict[str, Any] = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid JSON") from e

    event_type = str(payload.get("type") or "")
    data = payload.get("data")
    if not isinstance(data, dict):
        data = {}

    db = SessionLocal()
    try:
        if event_type == "video.asset.ready":
            _apply_asset_ready(db, data)
            db.commit()
        elif event_type in (
            "video.asset.static_rendition.ready",
            "video.asset.static_renditions.ready",
        ):
            _apply_static_rendition_ready(db, data)
            db.commit()
        elif event_type == "video.asset.errored":
            _apply_asset_errored(db, data)
            db.commit()
        else:
            # Acknowledge other events so Mux does not disable the endpoint.
            pass
    except Exception:
        logger.exception("Mux webhook handler error type=%s", event_type)
        db.rollback()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Webhook processing failed")
    finally:
        db.close()

    return {"received": "true"}

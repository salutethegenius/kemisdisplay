from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Media, PlaylistItem, Screen
from app.schemas import PublicPlaylistItem, PublicPlaylistResponse

router = APIRouter()


@router.get("/screens/{slug}/playlist", response_model=PublicPlaylistResponse)
def public_playlist(
    slug: str,
    token: str = Query(..., min_length=8),
    db: Session = Depends(get_db),
) -> PublicPlaylistResponse:
    screen = db.scalar(select(Screen).where(Screen.slug == slug))
    if not screen or screen.token != token:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    # Mark as "on the air" for the onboarding checklist. The display polls every
    # ~60s — throttle writes to once per 5 minutes per screen so we don't churn.
    now = datetime.now(timezone.utc)
    last = screen.last_polled_at
    if last is None or (now - last).total_seconds() > 300:
        screen.last_polled_at = now
        db.commit()
    items = db.scalars(
        select(PlaylistItem)
        .where(PlaylistItem.screen_id == screen.id)
        .order_by(PlaylistItem.sort_order)
    ).all()
    out_items: list[PublicPlaylistItem] = []
    for it in items:
        m = db.get(Media, it.media_id)
        if not m:
            continue
        if m.type == "video":
            if m.mux_status == "processing" or m.mux_status == "failed":
                continue
            if not (m.file_url or "").strip():
                continue
        out_items.append(
            PublicPlaylistItem(
                type=m.type,
                url=m.file_url,
                duration_seconds=it.duration_seconds,
            )
        )
    ver = screen.updated_at.isoformat() if screen.updated_at else ""
    return PublicPlaylistResponse(playlist_version=ver, items=out_items)

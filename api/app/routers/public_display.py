from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Media, PlaylistItem, Screen, User
from app.schemas import DisplayBootstrapOut, PublicPlaylistItem, PublicPlaylistResponse

router = APIRouter()


@router.get(
    "/accounts/{account_slug}/screens/{display_number}/bootstrap",
    response_model=DisplayBootstrapOut,
)
def bootstrap_display(
    account_slug: str,
    display_number: int,
    db: Session = Depends(get_db),
) -> DisplayBootstrapOut:
    if display_number < 1:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    user = db.scalar(select(User).where(User.account_slug == account_slug))
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    screen = db.scalar(
        select(Screen).where(
            Screen.user_id == user.id,
            Screen.display_number == display_number,
        )
    )
    if not screen:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    return DisplayBootstrapOut(slug=screen.slug, token=screen.token)


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
        # Core UPDATE only — avoids ORM onupdate bumping Screen.updated_at, which would
        # change playlist_version on every poll stamp and reset customer displays.
        db.execute(
            update(Screen)
            .where(Screen.id == screen.id)
            .values(last_polled_at=now)
        )
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

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Media, PlaylistItem, Screen, User
from app.schemas import PlaylistItemOut, PlaylistPutBody
from app.services.limits import billing_allows_write

router = APIRouter()


@router.get("/{screen_id}/playlist", response_model=list[PlaylistItemOut])
def get_playlist(
    screen_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PlaylistItemOut]:
    screen = db.get(Screen, screen_id)
    if not screen or screen.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    items = db.scalars(
        select(PlaylistItem)
        .where(PlaylistItem.screen_id == screen_id)
        .order_by(PlaylistItem.sort_order)
    ).all()
    out: list[PlaylistItemOut] = []
    for it in items:
        m = db.get(Media, it.media_id)
        if not m:
            continue
        out.append(
            PlaylistItemOut(
                id=it.id,
                media_id=it.media_id,
                sort_order=it.sort_order,
                duration_seconds=it.duration_seconds,
                file_url=m.file_url,
                type=m.type,
                filename=m.filename,
            )
        )
    return out


@router.put("/{screen_id}/playlist", response_model=list[PlaylistItemOut])
def put_playlist(
    screen_id: UUID,
    body: PlaylistPutBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PlaylistItemOut]:
    if not billing_allows_write(user):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Trial ended or no active plan. Subscribe to continue.",
        )
    screen = db.get(Screen, screen_id)
    if not screen or screen.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")

    media_ids = {it.media_id for it in body.items}
    for mid in media_ids:
        m = db.get(Media, mid)
        if not m or m.user_id != user.id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid media_id in playlist")

    db.execute(delete(PlaylistItem).where(PlaylistItem.screen_id == screen_id))
    for row in body.items:
        db.add(
            PlaylistItem(
                screen_id=screen_id,
                media_id=row.media_id,
                sort_order=row.sort_order,
                duration_seconds=row.duration_seconds,
            )
        )
    screen.updated_at = datetime.now(timezone.utc)
    db.commit()

    return get_playlist(screen_id, user, db)

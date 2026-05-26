import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Screen, User
from app.schemas import ScreenCreate, ScreenOut, ScreenUpdate
from app.services.limits import (
    billing_allows_write,
    count_user_screens,
    max_screens_for,
)
from app.services.slug import next_display_number, unique_slug

router = APIRouter()


def _screen_out(s: Screen, user: User) -> ScreenOut:
    return ScreenOut(
        id=s.id,
        name=s.name,
        slug=s.slug,
        token=s.token,
        display_number=s.display_number,
        display_url_hint=f"/{user.account_slug}/{s.display_number}",
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.get("", response_model=list[ScreenOut])
def list_screens(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ScreenOut]:
    rows = db.scalars(select(Screen).where(Screen.user_id == user.id).order_by(Screen.created_at)).all()
    return [_screen_out(s, user) for s in rows]


@router.post("", response_model=ScreenOut)
def create_screen(
    body: ScreenCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScreenOut:
    if not billing_allows_write(user):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Trial ended or no active plan. Subscribe to continue.",
        )
    limit = max_screens_for(user)
    if limit <= 0:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No screen slots available for your plan.")
    if count_user_screens(db, user.id) >= limit:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"Screen limit reached ({limit} for your plan).",
        )
    slug = unique_slug(db, body.name)
    token = secrets.token_urlsafe(24)
    display_number = next_display_number(db, user.id)
    screen = Screen(
        user_id=user.id,
        name=body.name.strip(),
        slug=slug,
        token=token,
        display_number=display_number,
    )
    db.add(screen)
    db.commit()
    db.refresh(screen)
    return _screen_out(screen, user)


@router.get("/{screen_id}", response_model=ScreenOut)
def get_screen(
    screen_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScreenOut:
    screen = db.get(Screen, screen_id)
    if not screen or screen.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    return _screen_out(screen, user)


@router.patch("/{screen_id}", response_model=ScreenOut)
def update_screen(
    screen_id: UUID,
    body: ScreenUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScreenOut:
    screen = db.get(Screen, screen_id)
    if not screen or screen.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    if body.name is not None:
        screen.name = body.name.strip()
    if body.regenerate_token:
        screen.token = secrets.token_urlsafe(24)
    screen.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(screen)
    return _screen_out(screen, user)


@router.delete("/{screen_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_screen(
    screen_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    screen = db.get(Screen, screen_id)
    if not screen or screen.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screen not found")
    db.delete(screen)
    db.commit()

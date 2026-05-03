"""Gamified onboarding checklist for new users.

Computes a 4-step checklist from existing data — no progress table, no extra
state writes during the user's normal actions. The only state we persist is
``users.onboarding_dismissed_at`` so users can hide the checklist after they're
done (or if they want it gone before they finish).

Steps and their server-side detection:

  1. Create your first screen     — any Screen owned by user
  2. Add your first content       — any Media or Menu owned by user
  3. Add it to your screen        — any PlaylistItem on a Screen owned by user
  4. You're on the air!           — any Screen of user has last_polled_at set
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Media, Menu, PlaylistItem, Screen, User

router = APIRouter()


class OnboardingStep(BaseModel):
    id: str
    title: str
    description: str
    cta_label: str
    cta_href: str
    done: bool


class OnboardingResponse(BaseModel):
    steps: list[OnboardingStep]
    percent: int
    completed: bool
    dismissed: bool


@router.get("", response_model=OnboardingResponse)
def get_onboarding(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OnboardingResponse:
    has_screen = db.scalar(
        select(exists().where(Screen.user_id == user.id))
    )
    has_content = db.scalar(
        select(exists().where(Media.user_id == user.id))
    ) or db.scalar(
        select(exists().where(Menu.user_id == user.id))
    )
    has_playlist_item = db.scalar(
        select(
            exists().where(
                PlaylistItem.screen_id.in_(
                    select(Screen.id).where(Screen.user_id == user.id)
                )
            )
        )
    )
    is_on_air = db.scalar(
        select(
            exists().where(
                Screen.user_id == user.id,
                Screen.last_polled_at.is_not(None),
            )
        )
    )

    steps = [
        OnboardingStep(
            id="screen",
            title="Create your first screen",
            description="Name your TV — you'll get a unique URL to open on it.",
            cta_label="Create a screen",
            cta_href="/dashboard/screens/new",
            done=bool(has_screen),
        ),
        OnboardingStep(
            id="content",
            title="Add your first content",
            description="Build a chalkboard menu, or upload an image or video.",
            cta_label="Add content",
            cta_href="/dashboard/menus/new",
            done=bool(has_content),
        ),
        OnboardingStep(
            id="playlist",
            title="Add it to your screen",
            description="Pick what plays on the TV and how long each item shows.",
            cta_label="Open playlist",
            cta_href="/dashboard",
            done=bool(has_playlist_item),
        ),
        OnboardingStep(
            id="on_air",
            title="You're on the air!",
            description="Open your screen URL on a TV browser to start playing.",
            cta_label="See screen URL",
            cta_href="/dashboard",
            done=bool(is_on_air),
        ),
    ]

    done_count = sum(1 for s in steps if s.done)
    percent = int(round(done_count * 100 / len(steps)))
    completed = done_count == len(steps)
    return OnboardingResponse(
        steps=steps,
        percent=percent,
        completed=completed,
        dismissed=user.onboarding_dismissed_at is not None,
    )


@router.post("/dismiss", status_code=status.HTTP_204_NO_CONTENT)
def dismiss_onboarding(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if user.onboarding_dismissed_at is None:
        user.onboarding_dismissed_at = datetime.now(timezone.utc)
        db.commit()

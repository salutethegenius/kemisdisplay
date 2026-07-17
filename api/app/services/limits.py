from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Media, Screen, User

# Trialing users use effective_tier "starter" (see effective_tier) — same screen cap as paid Starter.
SCREEN_LIMITS = {"starter": 2, "pro": 10, "business": 25}
STORAGE_BYTES = {"starter": 1 << 30, "pro": 5 << 30, "business": 20 << 30}


def effective_tier(user: User) -> str | None:
    if settings.dev_bypass_billing:
        return "business"
    now = datetime.now(timezone.utc)
    te = user.trial_ends_at
    if te.tzinfo is None:
        te = te.replace(tzinfo=timezone.utc)
    if user.plan in ("starter", "pro", "business"):
        return user.plan
    if user.plan == "trialing" and now < te:
        return "starter"
    return None


def billing_allows_write(user: User) -> bool:
    return effective_tier(user) is not None


def max_screens_for(user: User) -> int:
    tier = effective_tier(user)
    if tier is None:
        return 0
    return SCREEN_LIMITS.get(tier, 1)


def max_storage_bytes_for(user: User) -> int:
    tier = effective_tier(user)
    if tier is None:
        return 0
    return STORAGE_BYTES.get(tier, STORAGE_BYTES["starter"])


def count_user_screens(db: Session, user_id: UUID) -> int:
    return db.scalar(select(func.count()).select_from(Screen).where(Screen.user_id == user_id)) or 0


def sum_user_media_bytes(db: Session, user_id: UUID) -> int:
    total = db.scalar(
        select(func.coalesce(func.sum(Media.size_bytes), 0)).where(Media.user_id == user_id)
    )
    return int(total or 0)

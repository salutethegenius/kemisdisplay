import re
import secrets

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Screen, User

RESERVED_ACCOUNT_SLUGS = frozenset(
    {
        "login",
        "signup",
        "dashboard",
        "display",
        "demo",
        "schedule-demo",
        "privacy",
        "terms",
        "admin",
        "api",
        "public",
        "pwa-192",
        "pwa-512",
        "sentry-example-page",
        "files",
        "health",
        "auth",
        "screens",
        "media",
        "menus",
        "jobs",
        "mux",
        "billing",
        "onboarding",
        "freeport",
    }
)


def slugify_base(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")[:72]
    return s or "screen"


def is_reserved_account_slug(slug: str) -> bool:
    return slug.lower() in RESERVED_ACCOUNT_SLUGS


def normalize_account_slug(raw: str) -> str:
    s = raw.lower().strip()
    s = re.sub(r"[^a-z0-9-]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")[:80]
    return s


def validate_account_slug(raw: str) -> str:
    slug = normalize_account_slug(raw)
    if len(slug) < 2:
        raise ValueError("Account URL must be at least 2 characters")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise ValueError("Use lowercase letters, numbers, and hyphens only")
    if is_reserved_account_slug(slug):
        raise ValueError("That URL is reserved")
    return slug


def unique_account_slug(db: Session, name: str) -> str:
    base = slugify_base(name) if name.strip() else "account"
    if base == "screen":
        base = "account"
    candidate = base
    if not is_reserved_account_slug(candidate):
        found = db.scalar(select(User.id).where(User.account_slug == candidate))
        if not found:
            return candidate
    for _ in range(20):
        candidate = f"{base}-{secrets.token_hex(3)}"
        if is_reserved_account_slug(candidate):
            continue
        found = db.scalar(select(User.id).where(User.account_slug == candidate))
        if not found:
            return candidate
    return f"{base}-{secrets.token_hex(8)}"


def unique_slug(db: Session, name: str) -> str:
    base = slugify_base(name)
    for _ in range(20):
        candidate = f"{base}-{secrets.token_hex(3)}"
        found = db.scalar(select(Screen.id).where(Screen.slug == candidate))
        if not found:
            return candidate
    return f"{base}-{secrets.token_hex(8)}"


def next_display_number(db: Session, user_id) -> int:
    current = db.scalar(
        select(func.coalesce(func.max(Screen.display_number), 0)).where(
            Screen.user_id == user_id
        )
    )
    return int(current or 0) + 1

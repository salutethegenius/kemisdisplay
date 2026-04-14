import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Screen


def slugify_base(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")[:72]
    return s or "screen"


def unique_slug(db: Session, name: str) -> str:
    base = slugify_base(name)
    for _ in range(20):
        candidate = f"{base}-{secrets.token_hex(3)}"
        found = db.scalar(select(Screen.id).where(Screen.slug == candidate))
        if not found:
            return candidate
    return f"{base}-{secrets.token_hex(8)}"

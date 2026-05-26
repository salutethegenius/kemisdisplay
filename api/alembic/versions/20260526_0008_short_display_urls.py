"""short display URLs: users.account_slug + screens.display_number

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-26

"""

import re
import secrets
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

RESERVED = frozenset(
    {
        "login",
        "signup",
        "dashboard",
        "display",
        "demo",
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
        "onboarding",
    }
)


def _slugify_base(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")[:72]
    return s or "account"


def _backfill_account_slugs(connection) -> None:
    users = connection.execute(
        sa.text("SELECT id, business_name, email FROM users ORDER BY created_at")
    ).fetchall()
    taken: set[str] = set()
    for row in users:
        uid, business_name, email = row
        base = _slugify_base(business_name or email.split("@")[0])
        candidate = base
        if candidate in RESERVED or candidate in taken:
            for _ in range(20):
                candidate = f"{base}-{secrets.token_hex(3)}"
                if candidate not in RESERVED and candidate not in taken:
                    break
            else:
                candidate = f"{base}-{secrets.token_hex(8)}"
        taken.add(candidate)
        connection.execute(
            sa.text("UPDATE users SET account_slug = :slug WHERE id = :id"),
            {"slug": candidate, "id": uid},
        )


def upgrade() -> None:
    op.add_column("users", sa.Column("account_slug", sa.String(length=80), nullable=True))
    op.add_column("screens", sa.Column("display_number", sa.Integer(), nullable=True))

    op.execute(
        """
        UPDATE screens SET display_number = sub.rn
        FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
            FROM screens
        ) sub
        WHERE screens.id = sub.id
        """
    )

    conn = op.get_bind()
    _backfill_account_slugs(conn)

    op.alter_column("users", "account_slug", nullable=False)
    op.alter_column("screens", "display_number", nullable=False)
    op.create_index("ix_users_account_slug", "users", ["account_slug"], unique=True)
    op.create_unique_constraint(
        "uq_screens_user_display_number", "screens", ["user_id", "display_number"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_screens_user_display_number", "screens", type_="unique")
    op.drop_index("ix_users_account_slug", table_name="users")
    op.drop_column("screens", "display_number")
    op.drop_column("users", "account_slug")

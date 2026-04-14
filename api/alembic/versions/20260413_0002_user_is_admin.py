"""add users.is_admin

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-13

"""

from typing import Sequence, Union

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Idempotent: create_all() may have already added this column.
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false"
    )
    op.execute("ALTER TABLE users ALTER COLUMN is_admin DROP DEFAULT")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS is_admin")

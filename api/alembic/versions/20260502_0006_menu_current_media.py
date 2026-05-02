"""menu.current_media_id pointer for in-place reuse

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-02

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "menus",
        sa.Column("current_media_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_menus_current_media_id_media",
        "menus",
        "media",
        ["current_media_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # Backfill: point each menu at its most recent succeeded render's media.
    op.execute(
        sa.text(
            """
            UPDATE menus m
            SET current_media_id = sub.media_id
            FROM (
                SELECT DISTINCT ON (menu_id) menu_id, media_id
                FROM render_jobs
                WHERE status = 'succeeded' AND media_id IS NOT NULL
                ORDER BY menu_id, updated_at DESC
            ) sub
            WHERE m.id = sub.menu_id
            """
        )
    )


def downgrade() -> None:
    op.drop_constraint("fk_menus_current_media_id_media", "menus", type_="foreignkey")
    op.drop_column("menus", "current_media_id")

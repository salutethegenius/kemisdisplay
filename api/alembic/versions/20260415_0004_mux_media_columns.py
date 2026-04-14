"""mux columns on media

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-15

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("media", sa.Column("mux_asset_id", sa.String(length=128), nullable=True))
    op.add_column("media", sa.Column("mux_playback_id", sa.String(length=128), nullable=True))
    op.add_column("media", sa.Column("mux_status", sa.String(length=32), nullable=True))
    op.add_column("media", sa.Column("thumbnail_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("media", "thumbnail_url")
    op.drop_column("media", "mux_status")
    op.drop_column("media", "mux_playback_id")
    op.drop_column("media", "mux_asset_id")

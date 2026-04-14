"""initial kemisdisplay schema

Revision ID: 0001
Revises:
Create Date: 2026-04-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("business_name", sa.String(length=255), nullable=False),
        sa.Column("plan", sa.String(length=32), nullable=False),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("kemispay_customer_id", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "screens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_screens_slug"), "screens", ["slug"], unique=True)
    op.create_index(op.f("ix_screens_token"), "screens", ["token"], unique=False)
    op.create_index(op.f("ix_screens_user_id"), "screens", ["user_id"], unique=False)

    op.create_table(
        "media",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("filename", sa.String(length=512), nullable=False),
        sa.Column("file_url", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=16), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_media_user_id"), "media", ["user_id"], unique=False)

    op.create_table(
        "playlist_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("screen_id", sa.UUID(), nullable=False),
        sa.Column("media_id", sa.UUID(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["media_id"], ["media.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["screen_id"], ["screens.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("screen_id", "sort_order", name="uq_screen_order"),
    )
    op.create_index(
        op.f("ix_playlist_items_media_id"), "playlist_items", ["media_id"], unique=False
    )
    op.create_index(
        op.f("ix_playlist_items_screen_id"), "playlist_items", ["screen_id"], unique=False
    )


def downgrade() -> None:
    op.drop_table("playlist_items")
    op.drop_table("media")
    op.drop_table("screens")
    op.drop_table("users")

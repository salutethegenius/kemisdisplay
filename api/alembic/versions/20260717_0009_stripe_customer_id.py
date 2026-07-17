"""Rename kemispay_customer_id -> stripe_customer_id

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-17

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text(
            "ALTER TABLE users RENAME COLUMN kemispay_customer_id TO stripe_customer_id"
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            "ALTER TABLE users RENAME COLUMN stripe_customer_id TO kemispay_customer_id"
        )
    )

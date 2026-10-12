"""add transfer value to transaction type enum

Revision ID: e8b1c3d5f7a2
Revises: c3d5e7f9a1b2
Create Date: 2026-10-12 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e8b1c3d5f7a2'
down_revision = 'c3d5e7f9a1b2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'transfer' to the transaction type enum. This must commit in its own
    # transaction before any schema references the new value.
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'transfer'")


def downgrade() -> None:
    # PostgreSQL cannot remove an enum value in-place; leave it for forward-only.
    pass

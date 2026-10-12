"""enforce unique account name per owner

Revision ID: c3d5e7f9a1b2
Revises: 37c08a2cbadf
Create Date: 2026-10-12 22:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3d5e7f9a1b2'
down_revision = '37c08a2cbadf'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint('uq_accounts_owner_id_name', 'accounts', ['owner_id', 'name'])


def downgrade() -> None:
    op.drop_constraint('uq_accounts_owner_id_name', 'accounts', type_='unique')

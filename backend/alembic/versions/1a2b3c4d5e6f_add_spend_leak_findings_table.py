"""add spend leak findings table

Revision ID: 1a2b3c4d5e6f
Revises: f9a1b2c3d4e5
Create Date: 2026-10-24 07:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = 'f9a1b2c3d4e5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'spend_leak_findings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('owner_id', sa.String(length=64), nullable=False),
        sa.Column('finding_key', sa.String(length=128), nullable=False),
        sa.Column('finding_type', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='new'),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('first_detected_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('last_detected_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('owner_id', 'finding_key', name='uq_spend_leak_finding_owner_key'),
    )
    op.create_index('ix_spend_leak_findings_owner_id', 'spend_leak_findings', ['owner_id'], unique=False)
    op.create_index('ix_spend_leak_findings_finding_key', 'spend_leak_findings', ['finding_key'], unique=False)
    op.create_index('ix_spend_leak_findings_owner_status', 'spend_leak_findings', ['owner_id', 'status'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_spend_leak_findings_owner_status', table_name='spend_leak_findings')
    op.drop_index('ix_spend_leak_findings_finding_key', table_name='spend_leak_findings')
    op.drop_index('ix_spend_leak_findings_owner_id', table_name='spend_leak_findings')
    op.drop_table('spend_leak_findings')

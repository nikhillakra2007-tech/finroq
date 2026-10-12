"""add budgets table

Revision ID: b7d2e4f6a9c1
Revises: a2c4e6f8b1d3
Create Date: 2026-10-12 23:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7d2e4f6a9c1'
down_revision = 'a2c4e6f8b1d3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'budgets',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('owner_id', sa.String(length=64), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('budget_year', sa.Integer(), nullable=False),
        sa.Column('budget_month', sa.Integer(), nullable=False),
        sa.Column('allocated_amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('owner_id', 'category_id', 'budget_year', 'budget_month', name='uq_budget_owner_category_period'),
        sa.CheckConstraint('budget_month BETWEEN 1 AND 12', name='ck_budgets_month_range'),
        sa.CheckConstraint('allocated_amount >= 0', name='ck_budgets_allocated_nonnegative'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_budgets_owner_id'), 'budgets', ['owner_id'], unique=False)
    op.create_index(op.f('ix_budgets_category_id'), 'budgets', ['category_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_budgets_category_id'), table_name='budgets')
    op.drop_index(op.f('ix_budgets_owner_id'), table_name='budgets')
    op.drop_table('budgets')

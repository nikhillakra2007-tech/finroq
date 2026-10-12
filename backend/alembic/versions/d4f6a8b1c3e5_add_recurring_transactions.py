"""add recurring transactions and occurrences tables

Revision ID: d4f6a8b1c3e5
Revises: b7d2e4f6a9c1
Create Date: 2026-10-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM


# revision identifiers, used by Alembic.
revision = 'd4f6a8b1c3e5'
down_revision = 'b7d2e4f6a9c1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        op.execute("DO $$ BEGIN CREATE TYPE recurrencefrequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
        op.execute("DO $$ BEGIN CREATE TYPE recurrencestatus AS ENUM ('active', 'paused'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    frequency_enum = PG_ENUM('daily', 'weekly', 'monthly', 'yearly', name='recurrencefrequency', create_type=False) if is_postgres else sa.Enum('daily', 'weekly', 'monthly', 'yearly', name='recurrencefrequency')
    status_enum = PG_ENUM('active', 'paused', name='recurrencestatus', create_type=False) if is_postgres else sa.Enum('active', 'paused', name='recurrencestatus')
    tx_type_enum = PG_ENUM('income', 'expense', 'transfer', name='transactiontype', create_type=False) if is_postgres else sa.Enum('income', 'expense', 'transfer', name='transactiontype')

    op.create_table(
        'recurring_transactions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('owner_id', sa.String(length=64), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('to_account_id', sa.Integer(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('transaction_type', tx_type_enum, nullable=False),
        sa.Column('frequency', frequency_enum, nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('next_occurrence', sa.DateTime(), nullable=True),
        sa.Column('status', status_enum, server_default='active', nullable=False),
        sa.Column('description', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('amount > 0', name='ck_recurring_amount_positive'),
        sa.CheckConstraint(
            "(transaction_type = 'transfer' AND to_account_id IS NOT NULL) OR (transaction_type <> 'transfer')",
            name='ck_recurring_transfer_requires_destination',
        ),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['to_account_id'], ['accounts.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
    )
    op.create_index(op.f('ix_recurring_transactions_owner_id'), 'recurring_transactions', ['owner_id'], unique=False)
    op.create_index(op.f('ix_recurring_transactions_account_id'), 'recurring_transactions', ['account_id'], unique=False)
    op.create_index(op.f('ix_recurring_transactions_next_occurrence'), 'recurring_transactions', ['next_occurrence'], unique=False)

    op.create_table(
        'recurring_occurrences',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('recurring_id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('occurrence_date', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('recurring_id', 'occurrence_date', name='uq_recurring_occurrence_date'),
        sa.ForeignKeyConstraint(['recurring_id'], ['recurring_transactions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_recurring_occurrences_recurring_id'), 'recurring_occurrences', ['recurring_id'], unique=False)
    op.create_index(op.f('ix_recurring_occurrences_transaction_id'), 'recurring_occurrences', ['transaction_id'], unique=False)

    op.add_column(
        'transactions',
        sa.Column('recurring_transaction_id', sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        'fk_transactions_recurring_transaction_id',
        'transactions',
        'recurring_transactions',
        ['recurring_transaction_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_index(op.f('ix_transactions_recurring_transaction_id'), 'transactions', ['recurring_transaction_id'], unique=False)


def downgrade() -> None:
    op.drop_constraint('fk_transactions_recurring_transaction_id', 'transactions', type_='foreignkey')
    op.drop_index(op.f('ix_transactions_recurring_transaction_id'), table_name='transactions')
    op.drop_column('transactions', 'recurring_transaction_id')

    op.drop_index(op.f('ix_recurring_occurrences_transaction_id'), table_name='recurring_occurrences')
    op.drop_index(op.f('ix_recurring_occurrences_recurring_id'), table_name='recurring_occurrences')
    op.drop_table('recurring_occurrences')

    op.drop_index(op.f('ix_recurring_transactions_next_occurrence'), table_name='recurring_transactions')
    op.drop_index(op.f('ix_recurring_transactions_account_id'), table_name='recurring_transactions')
    op.drop_index(op.f('ix_recurring_transactions_owner_id'), table_name='recurring_transactions')
    op.drop_table('recurring_transactions')

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP TYPE IF EXISTS recurrencestatus")
        op.execute("DROP TYPE IF EXISTS recurrencefrequency")

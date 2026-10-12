"""add status, transfer destination, and refund linkage to transactions

Revision ID: a2c4e6f8b1d3
Revises: e8b1c3d5f7a2
Create Date: 2026-10-12 23:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a2c4e6f8b1d3'
down_revision = 'e8b1c3d5f7a2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the transaction status enum
    op.execute("CREATE TYPE transactionstatus AS ENUM ('completed', 'pending', 'cancelled')")

    # Add status column with default
    op.add_column(
        'transactions',
        sa.Column(
            'status',
            sa.Enum('completed', 'pending', 'cancelled', name='transactionstatus'),
            server_default='completed',
            nullable=False,
        ),
    )

    # Add transfer destination account
    op.add_column('transactions', sa.Column('to_account_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_transactions_to_account_id', 'transactions', 'accounts',
        ['to_account_id'], ['id'], ondelete='RESTRICT',
    )
    op.create_index('ix_transactions_to_account_id', 'transactions', ['to_account_id'], unique=False)

    # Add related transaction (refund/reversal linkage)
    op.add_column('transactions', sa.Column('related_transaction_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_transactions_related_transaction_id', 'transactions', 'transactions',
        ['related_transaction_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index('ix_transactions_related_transaction_id', 'transactions', ['related_transaction_id'], unique=False)

    # Transfers must have a destination account
    op.create_check_constraint(
        'ck_transactions_transfer_requires_destination',
        'transactions',
        "(transaction_type = 'transfer' AND to_account_id IS NOT NULL) OR (transaction_type <> 'transfer')",
    )


def downgrade() -> None:
    op.drop_constraint('ck_transactions_transfer_requires_destination', 'transactions', type_='check')
    op.drop_index('ix_transactions_related_transaction_id', table_name='transactions')
    op.drop_constraint('fk_transactions_related_transaction_id', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'related_transaction_id')
    op.drop_index('ix_transactions_to_account_id', table_name='transactions')
    op.drop_constraint('fk_transactions_to_account_id', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'to_account_id')
    op.drop_column('transactions', 'status')
    op.execute("DROP TYPE IF EXISTS transactionstatus")

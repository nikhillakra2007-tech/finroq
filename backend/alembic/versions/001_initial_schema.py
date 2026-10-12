"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2026-10-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create accounts table
    op.create_table(
        'accounts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('owner_id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('account_type', sa.Enum('checking', 'savings', 'credit', 'investment', 'cash', 'other', name='accounttype'), nullable=False, server_default='checking'),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='USD'),
        sa.Column('initial_balance', sa.Numeric(precision=14, scale=2), nullable=False, server_default='0.00'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('initial_balance >= 0', name='ck_accounts_initial_balance_nonnegative'),
    )
    op.create_index('ix_accounts_owner_id_name', 'accounts', ['owner_id', 'name'], unique=False)
    op.create_index(op.f('ix_accounts_owner_id'), 'accounts', ['owner_id'], unique=False)

    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('category_type', sa.Enum('income', 'expense', 'both', name='categorytype'), nullable=False, server_default='expense'),
        sa.Column('owner_id', sa.String(length=64), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', 'owner_id', 'category_type', name='uq_category_name_owner_type'),
    )
    op.create_index('ix_categories_owner_id_type', 'categories', ['owner_id', 'category_type'], unique=False)

    # Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('owner_id', sa.String(length=64), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='USD'),
        sa.Column('transaction_type', sa.Enum('income', 'expense', name='transactiontype'), nullable=False),
        sa.Column('description', sa.String(length=512), nullable=True),
        sa.Column('transaction_date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('amount > 0', name='ck_transactions_amount_positive'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_transactions_owner_account_date', 'transactions', ['owner_id', 'account_id', 'transaction_date'], unique=False)
    op.create_index('ix_transactions_owner_type_date', 'transactions', ['owner_id', 'transaction_type', 'transaction_date'], unique=False)
    op.create_index(op.f('ix_transactions_owner_id'), 'transactions', ['owner_id'], unique=False)
    op.create_index(op.f('ix_transactions_account_id'), 'transactions', ['account_id'], unique=False)
    op.create_index(op.f('ix_transactions_category_id'), 'transactions', ['category_id'], unique=False)
    op.create_index(op.f('ix_transactions_transaction_date'), 'transactions', ['transaction_date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_transactions_transaction_date'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_category_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_account_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_owner_id'), table_name='transactions')
    op.drop_index('ix_transactions_owner_type_date', table_name='transactions')
    op.drop_index('ix_transactions_owner_account_date', table_name='transactions')
    op.drop_table('transactions')
    op.drop_index('ix_categories_owner_id_type', table_name='categories')
    op.drop_table('categories')
    op.drop_index(op.f('ix_accounts_owner_id'), table_name='accounts')
    op.drop_index('ix_accounts_owner_id_name', table_name='accounts')
    op.drop_table('accounts')
    op.execute('DROP TYPE IF EXISTS accounttype')
    op.execute('DROP TYPE IF EXISTS categorytype')
    op.execute('DROP TYPE IF EXISTS transactiontype')
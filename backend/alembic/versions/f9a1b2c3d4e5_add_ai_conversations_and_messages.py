"""add ai conversations and messages tables

Revision ID: f9a1b2c3d4e5
Revises: d4f6a8b1c3e5
Create Date: 2026-10-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f9a1b2c3d4e5'
down_revision = 'd4f6a8b1c3e5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. ai_conversations
    op.create_table(
        'ai_conversations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('owner_id', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False, server_default='New Conversation'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ai_conversations_owner_id', 'ai_conversations', ['owner_id'], unique=False)

    # 2. ai_messages
    op.create_table(
        'ai_messages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('conversation_id', sa.String(length=36), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('content', sa.String(length=8192), nullable=False),
        sa.Column('structured_data', sa.String(length=16384), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['conversation_id'], ['ai_conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ai_messages_conversation_id', 'ai_messages', ['conversation_id'], unique=False)

    # 3. ai_usage_logs
    op.create_table(
        'ai_usage_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('owner_id', sa.String(length=64), nullable=False),
        sa.Column('conversation_id', sa.String(length=36), nullable=True),
        sa.Column('model', sa.String(length=64), nullable=False),
        sa.Column('prompt_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completion_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tool_calls_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('duration_ms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ai_usage_logs_owner_id', 'ai_usage_logs', ['owner_id'], unique=False)
    op.create_index('ix_ai_usage_logs_conversation_id', 'ai_usage_logs', ['conversation_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_ai_usage_logs_conversation_id', table_name='ai_usage_logs')
    op.drop_index('ix_ai_usage_logs_owner_id', table_name='ai_usage_logs')
    op.drop_table('ai_usage_logs')
    op.drop_index('ix_ai_messages_conversation_id', table_name='ai_messages')
    op.drop_table('ai_messages')
    op.drop_index('ix_ai_conversations_owner_id', table_name='ai_conversations')
    op.drop_table('ai_conversations')

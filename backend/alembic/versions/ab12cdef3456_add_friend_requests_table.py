"""add friend requests table

Revision ID: ab12cdef3456
Revises: f08c746e70a9
Create Date: 2025-11-21
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'ab12cdef3456'
down_revision = '9a8b7c6d5e4f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # For SQLite dev environments where a prior failed run may have left the table,
    # ensure a clean slate.
    op.execute("DROP TABLE IF EXISTS friend_requests")
    op.execute("DROP INDEX IF EXISTS ix_friend_requests_requester_id")
    op.execute("DROP INDEX IF EXISTS ix_friend_requests_receiver_id")
    op.create_table(
        'friend_requests',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('requester_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('receiver_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('requester_id', 'receiver_id', name='uq_friend_request_pair'),
    )
    op.create_index('ix_friend_requests_requester_id', 'friend_requests', ['requester_id'])
    op.create_index('ix_friend_requests_receiver_id', 'friend_requests', ['receiver_id'])


def downgrade() -> None:
    op.drop_index('ix_friend_requests_receiver_id', table_name='friend_requests')
    op.drop_index('ix_friend_requests_requester_id', table_name='friend_requests')
    op.drop_constraint('uq_friend_request_pair', 'friend_requests', type_='unique')
    op.drop_table('friend_requests')
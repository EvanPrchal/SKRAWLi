"""add picture_url to users

Revision ID: c23456789abc
Revises: b1234567890a
Create Date: 2025-11-21
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c23456789abc'
down_revision = 'b1234567890a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('picture_url', sa.String(length=512), nullable=True))


def downgrade() -> None:
    # SQLite prior to 3.35 lacks DROP COLUMN; keep column to avoid data loss
    pass

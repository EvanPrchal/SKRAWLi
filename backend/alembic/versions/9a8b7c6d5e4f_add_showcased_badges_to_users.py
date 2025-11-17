"""add_showcased_badges_to_users

Revision ID: 9a8b7c6d5e4f
Revises: 8d9f9d5e7c44
Create Date: 2025-11-17 00:00:01.000000

"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = "9a8b7c6d5e4f"
down_revision: str | Sequence[str] | None = "8d9f9d5e7c44"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('showcased_badges', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'showcased_badges')

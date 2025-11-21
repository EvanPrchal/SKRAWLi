"""add short_id to users

Revision ID: b1234567890a
Revises: ab12cdef3456
Create Date: 2025-11-21
"""

from alembic import op
import sqlalchemy as sa
import random

# revision identifiers, used by Alembic.
revision = 'b1234567890a'
down_revision = 'ab12cdef3456'
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()

    # Check if column exists
    cols = connection.execute(sa.text("PRAGMA table_info('users')")).fetchall()
    col_names = {c[1] for c in cols}
    if 'short_id' not in col_names:
        op.add_column('users', sa.Column('short_id', sa.String(length=4), nullable=True))

    # Populate only rows missing short_id
    existing = connection.execute(sa.text("SELECT id FROM users WHERE short_id IS NULL"))
    used_codes = {r[0] for r in connection.execute(sa.text("SELECT short_id FROM users WHERE short_id IS NOT NULL")).fetchall() if r[0]}

    for row in existing:
        # Generate a unique 4-digit code
        for _ in range(50):
            code = f"{random.randint(0, 9999):04d}"
            if code not in used_codes:
                taken = connection.execute(sa.text("SELECT 1 FROM users WHERE short_id = :code"), {"code": code}).fetchone()
                if taken:
                    continue
                used_codes.add(code)
                connection.execute(sa.text("UPDATE users SET short_id = :code WHERE id = :id"), {"code": code, "id": row.id})
                break
        else:
            for seq in range(10000):
                code = f"{seq:04d}"
                if code not in used_codes:
                    taken = connection.execute(sa.text("SELECT 1 FROM users WHERE short_id = :code"), {"code": code}).fetchone()
                    if not taken:
                        used_codes.add(code)
                        connection.execute(sa.text("UPDATE users SET short_id = :code WHERE id = :id"), {"code": code, "id": row.id})
                        break

    # Enforce uniqueness via unique index (SQLite-friendly)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_users_short_id ON users (short_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ux_users_short_id")
    # Keeping the column to avoid data loss; if needed, uncomment the next line, but SQLite lacks DROP COLUMN pre-3.35
    # op.drop_column('users', 'short_id')

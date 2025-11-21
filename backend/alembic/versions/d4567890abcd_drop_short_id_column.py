"""drop short_id column

Revision ID: d4567890abcd
Revises: c23456789abc
Create Date: 2025-11-21
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd4567890abcd'
down_revision = 'c23456789abc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Physically remove the short_id column from users table (SQLite-safe)."""
    conn = op.get_bind()
    # Drop unique index if it exists
    conn.execute(sa.text("DROP INDEX IF EXISTS ux_users_short_id"))

    # Check if column exists; if not, nothing to do
    cols = conn.execute(sa.text("PRAGMA table_info('users')")).fetchall()
    col_names = {c[1] for c in cols}
    if 'short_id' not in col_names:
        return

    # SQLite requires table rebuild to drop a column (prior to robust ALTER support)
    conn.execute(sa.text("PRAGMA foreign_keys=OFF"))
    # Create new table without short_id
    conn.execute(sa.text(
        """
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            auth0_sub VARCHAR NOT NULL,
            picture_url VARCHAR(512),
            coins INTEGER NOT NULL DEFAULT 0,
            bio VARCHAR(500),
            display_name VARCHAR(50),
            profile_background VARCHAR(50) DEFAULT 'bg-skrawl-black',
            showcased_badges VARCHAR(200)
        );
        """
    ))
    # Copy data
    conn.execute(sa.text(
        """
        INSERT INTO users_new (id, auth0_sub, picture_url, coins, bio, display_name, profile_background, showcased_badges)
        SELECT id, auth0_sub, picture_url, coins, bio, display_name, profile_background, showcased_badges FROM users;
        """
    ))
    # Drop old table and rename
    conn.execute(sa.text("DROP TABLE users"))
    conn.execute(sa.text("ALTER TABLE users_new RENAME TO users"))
    # Recreate indexes that existed (auth0_sub unique/index)
    conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_auth0_sub ON users (auth0_sub)"))
    conn.execute(sa.text("PRAGMA foreign_keys=ON"))


def downgrade() -> None:
    """Re-add short_id column (values will be NULL)."""
    conn = op.get_bind()
    cols = conn.execute(sa.text("PRAGMA table_info('users')")).fetchall()
    col_names = {c[1] for c in cols}
    if 'short_id' in col_names:
        return
    conn.execute(sa.text("ALTER TABLE users ADD COLUMN short_id VARCHAR(4)"))
    # Recreate unique index (will succeed only when populated uniquely later)
    conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ux_users_short_id ON users (short_id)"))
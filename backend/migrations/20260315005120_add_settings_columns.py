"""
Migration : add_settings_columns
Created   : adds preference columns to users table
            (notifications and privacy removed — not used in frontend)
"""


def up(conn):
    """Apply the migration."""
    cur = conn.cursor()

    # Preference columns only
    cur.execute("""
        ALTER TABLE users
            ADD COLUMN IF NOT EXISTS language VARCHAR(20) NOT NULL DEFAULT 'nepali',
            ADD COLUMN IF NOT EXISTS timezone  VARCHAR(50) NOT NULL DEFAULT 'asia-kathmandu'
    """)

    # Backfill existing rows
    cur.execute("""
        UPDATE users SET
            language = 'nepali',
            timezone = 'asia-kathmandu'
        WHERE
            language IS NULL OR
            timezone IS NULL
    """)

    conn.commit()
    cur.close()


def down(conn):
    """Reverse the migration."""
    cur = conn.cursor()

    cur.execute("""
        ALTER TABLE users
            DROP COLUMN IF EXISTS language,
            DROP COLUMN IF EXISTS timezone
    """)

    conn.commit()
    cur.close()
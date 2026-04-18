"""
Migration : create_chat_history_table
Created   : 2026-03-15 04:00:00
"""


def up(conn):
    """Apply the migration — create chat_history table."""
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id         SERIAL      PRIMARY KEY,
            user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role       VARCHAR(20) NOT NULL,
            content    TEXT        NOT NULL,
            is_error   BOOLEAN     NOT NULL DEFAULT FALSE,
            is_upgrade BOOLEAN     NOT NULL DEFAULT FALSE,
            is_notice  BOOLEAN     NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP            DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute(
        "CREATE INDEX IF NOT EXISTS ix_chat_history_user_id    ON chat_history (user_id);"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS ix_chat_history_created_at ON chat_history (created_at);"
    )

    conn.commit()
    cur.close()


def down(conn):
    """Reverse the migration — drop chat_history table."""
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS chat_history CASCADE;")

    conn.commit()
    cur.close()
"""
Migration : add_session_id_to_chat_history
Created   : 2026-03-21 00:00:00
"""


def up(conn):
    cur = conn.cursor()

    # Add session_id column
    cur.execute("""
        ALTER TABLE chat_history
        ADD COLUMN IF NOT EXISTS session_id VARCHAR(36) DEFAULT NULL;
    """)

    # Add session title column (first user message preview)
    cur.execute("""
        ALTER TABLE chat_history
        ADD COLUMN IF NOT EXISTS session_title TEXT DEFAULT NULL;
    """)

    cur.execute(
        "CREATE INDEX IF NOT EXISTS ix_chat_history_session_id ON chat_history (session_id);"
    )

    conn.commit()
    cur.close()


def down(conn):
    cur = conn.cursor()
    cur.execute("ALTER TABLE chat_history DROP COLUMN IF EXISTS session_id;")
    cur.execute("ALTER TABLE chat_history DROP COLUMN IF EXISTS session_title;")
    conn.commit()
    cur.close()
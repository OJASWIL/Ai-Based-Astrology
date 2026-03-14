"""
Migration : add_chat_usage_tracking
Created   : tracks daily chatbot usage per user in DB
"""


def up(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS chat_usage (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            usage_date DATE    NOT NULL DEFAULT CURRENT_DATE,
            count      INTEGER NOT NULL DEFAULT 0,
            UNIQUE(user_id, usage_date)
        )
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_chat_usage_user_date
        ON chat_usage(user_id, usage_date)
    """)
    conn.commit()
    cur.close()


def down(conn):
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS chat_usage")
    conn.commit()
    cur.close()
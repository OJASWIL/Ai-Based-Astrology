"""
Migration : add_premium_expires_at_to_chat_usage
Created   : 2026-03-22 01:00:00
"""


def up(conn):
    cur = conn.cursor()

    cur.execute("""
        ALTER TABLE chat_usage
        ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP DEFAULT NULL;
    """)

    conn.commit()
    cur.close()


def down(conn):
    cur = conn.cursor()
    cur.execute("ALTER TABLE chat_usage DROP COLUMN IF EXISTS premium_expires_at;")
    conn.commit()
    cur.close()
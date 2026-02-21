"""
Migration : create_birth_details
Created   : 2026-02-21 17:01:48
"""


def up(conn):
    """Apply the migration."""
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS birth_details (
            id          SERIAL PRIMARY KEY,
            user_id     INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            full_name   VARCHAR(100)   NOT NULL,
            gender      VARCHAR(10)    NOT NULL CHECK (gender IN ('male', 'female', 'other')),
            birth_date  DATE           NOT NULL,
            birth_time  TIME           NOT NULL,
            birth_place VARCHAR(100)   NOT NULL,
            latitude    NUMERIC(10, 6) NOT NULL,
            longitude   NUMERIC(10, 6) NOT NULL,
            created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_birth_details_user_id
        ON birth_details(user_id);
    """)

    conn.commit()
    cur.close()


def down(conn):
    """Reverse the migration."""
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS birth_details CASCADE;")

    conn.commit()
    cur.close()
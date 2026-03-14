

def up(conn):
    """Apply the migration."""
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS gochar_records (
            id                SERIAL PRIMARY KEY,
            user_id           INTEGER NOT NULL UNIQUE
                                  REFERENCES users(id) ON DELETE CASCADE,

            natal_lagna_sign    VARCHAR(50) NOT NULL,
            natal_lagna_sign_np VARCHAR(50) NOT NULL,

            houses              JSONB NOT NULL DEFAULT '[]',
            transit_details     JSONB NOT NULL DEFAULT '[]',

            calculated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_gochar_records_user_id
        ON gochar_records(user_id);
    """)

    conn.commit()
    cur.close()


def down(conn):
    """Reverse the migration."""
    cur = conn.cursor()

    cur.execute("""
        DROP TABLE IF EXISTS gochar_records CASCADE;
    """)

    conn.commit()
    cur.close()

def up(conn):
    """Apply the migration."""
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS janma_kundali_records (
            id                  SERIAL PRIMARY KEY,
            user_id             INTEGER NOT NULL UNIQUE
                                    REFERENCES users(id) ON DELETE CASCADE,


            lagna_sign_np       VARCHAR(50)  NOT NULL,
            lagna_degree        VARCHAR(20)  NOT NULL,

            rashi_sign_np       VARCHAR(50)  NOT NULL,

            nakshatra           VARCHAR(100) NOT NULL,
            nakshatra_pada      SMALLINT     NOT NULL,

            houses              JSONB        NOT NULL DEFAULT '[]',
            planetary_positions JSONB        NOT NULL DEFAULT '[]',
            dasha               JSONB        NOT NULL DEFAULT '[]',
            yogas               JSONB        NOT NULL DEFAULT '[]',

            calculated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_janma_kundali_records_user_id
        ON janma_kundali_records(user_id);
    """)

    conn.commit()
    cur.close()


def down(conn):
    """Reverse the migration."""
    cur = conn.cursor()

    cur.execute("""
        DROP TABLE IF EXISTS janma_kundali_records CASCADE;
    """)

    conn.commit()
    cur.close()
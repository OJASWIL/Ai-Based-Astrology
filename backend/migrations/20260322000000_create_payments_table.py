"""
Migration : create_payments_table
Created   : 2026-03-22 00:00:00
"""


def up(conn):
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id               SERIAL       PRIMARY KEY,
            user_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            transaction_uuid VARCHAR(100) NOT NULL UNIQUE,
            ref_id           VARCHAR(100),
            product_code     VARCHAR(100),
            plan_name        VARCHAR(100),
            amount           NUMERIC(10,2) NOT NULL,
            status           VARCHAR(20)  NOT NULL DEFAULT 'COMPLETE',
            created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("CREATE INDEX IF NOT EXISTS ix_payments_user_id ON payments (user_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_payments_transaction_uuid ON payments (transaction_uuid);")

    conn.commit()
    cur.close()


def down(conn):
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS payments CASCADE;")
    conn.commit()
    cur.close()
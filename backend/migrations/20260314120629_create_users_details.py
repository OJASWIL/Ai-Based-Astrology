


def up(conn):
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          SERIAL PRIMARY KEY,
            full_name   VARCHAR(100)  NOT NULL,
            email       VARCHAR(150)  UNIQUE NOT NULL,
            password    VARCHAR(255)  NOT NULL,
            is_active   BOOLEAN       DEFAULT TRUE,
            created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
            last_login  TIMESTAMP
        );
    """)

    conn.commit()
    cur.close()


def down(conn):
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS users CASCADE;")
    conn.commit()
    cur.close()
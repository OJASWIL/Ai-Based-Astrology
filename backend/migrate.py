from app import create_app
from app.db import get_db

app = create_app()

def run_migrations():
    with app.app_context():
        conn = get_db()
        cur  = conn.cursor()

        # Users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id             SERIAL PRIMARY KEY,
                full_name      VARCHAR(100)  NOT NULL,
                email          VARCHAR(150)  UNIQUE NOT NULL,
                password_hash  VARCHAR(255)  NOT NULL,
                is_active      BOOLEAN       DEFAULT TRUE,
                created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
                updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
                last_login     TIMESTAMP
            );
        """)

        conn.commit()
        cur.close()
        print("✅ All tables created successfully.")

if __name__ == "__main__":
    run_migrations()
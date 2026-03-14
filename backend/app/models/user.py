from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from app.db import get_db


class User:
    def __init__(self, row: dict):
        self.id          = row["id"]
        self.full_name   = row["full_name"]
        self.email       = row["email"]
        self.password    = row["password"]
        self.is_active   = row["is_active"]
        self.created_at  = row["created_at"]
        self.updated_at  = row["updated_at"]
        self.last_login  = row["last_login"]
        self.language    = row.get("language", "nepali")
        self.timezone    = row.get("timezone", "asia-kathmandu")

    def set_password(self, password: str):
        self.password = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            "id":         self.id,
            "full_name":  self.full_name,
            "email":      self.email,
            "is_active":  self.is_active,
            "created_at": self.created_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

    def __repr__(self):
        return f"<User {self.email}>"

    @staticmethod
    def find_by_email(email: str):
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        row  = cur.fetchone()
        cur.close()
        return User(row) if row else None

    @staticmethod
    def find_by_id(user_id: int):
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        row  = cur.fetchone()
        cur.close()
        return User(row) if row else None

    @staticmethod
    def create(full_name: str, email: str, password: str):
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO users (full_name, email, password)
            VALUES (%s, %s, %s)
            RETURNING *
        """, (full_name, email, password))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        return User(row)

    def update_last_login(self):
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "UPDATE users SET last_login = %s WHERE id = %s RETURNING last_login",
            (datetime.utcnow(), self.id)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        self.last_login = row["last_login"]

    def update_profile(self, full_name: str, email: str):
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("""
            UPDATE users SET full_name = %s, email = %s
            WHERE id = %s
            RETURNING full_name, email, updated_at
        """, (full_name, email, self.id))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        self.full_name  = row["full_name"]
        self.email      = row["email"]
        self.updated_at = row["updated_at"]

    def update_password(self, new_hashed_password: str):
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "UPDATE users SET password = %s WHERE id = %s",
            (new_hashed_password, self.id)
        )
        conn.commit()
        cur.close()
        self.password = new_hashed_password

    def update_preferences(self, language: str, timezone: str):
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("""
            UPDATE users SET language = %s, timezone = %s
            WHERE id = %s
        """, (language, timezone, self.id))
        conn.commit()
        cur.close()
        self.language = language
        self.timezone = timezone

    def delete(self):
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("DELETE FROM users WHERE id = %s", (self.id,))
        conn.commit()
        cur.close()
from datetime import datetime
from app.db import get_db

FREE_LIMIT = 10


class ChatUsage:

    @staticmethod
    def get_today_count(user_id: int) -> int:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("""
            SELECT count FROM chat_usage
            WHERE user_id = %s AND usage_date = CURRENT_DATE
        """, (user_id,))
        row = cur.fetchone()
        cur.close()
        return row["count"] if row else 0

    @staticmethod
    def is_premium(user_id: int) -> bool:
        """Check subscription from user_premium table."""
        try:
            conn = get_db()
            cur  = conn.cursor()
            cur.execute("""
                SELECT is_premium, premium_expires_at 
                FROM user_premium 
                WHERE user_id = %s
            """, (user_id,))
            row = cur.fetchone()
            cur.close()

            if not row or not row["is_premium"]:
                return False

            # Check if subscription has expired
            if row["premium_expires_at"]:
                if datetime.utcnow() > row["premium_expires_at"]:
                    # Auto-mark expired in DB
                    conn2 = get_db()
                    cur2  = conn2.cursor()
                    cur2.execute(
                        "UPDATE user_premium SET is_premium = FALSE WHERE user_id = %s",
                        (user_id,)
                    )
                    conn2.commit()
                    cur2.close()
                    return False

            return True
        except Exception:
            return False

    @staticmethod
    def increment(user_id: int) -> int:
        """Increment count and return new count."""
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO chat_usage (user_id, usage_date, count)
            VALUES (%s, CURRENT_DATE, 1)
            ON CONFLICT (user_id, usage_date)
            DO UPDATE SET count = chat_usage.count + 1
            RETURNING count
        """, (user_id,))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        return row["count"] if row else 1

    @staticmethod
    def can_chat(user_id: int) -> tuple[bool, int, int]:
        """Returns (can_chat, used, remaining)."""
        if ChatUsage.is_premium(user_id):
            used = ChatUsage.get_today_count(user_id)
            return True, used, -1  # -1 = unlimited
        used      = ChatUsage.get_today_count(user_id)
        remaining = max(0, FREE_LIMIT - used)
        return remaining > 0, used, remaining
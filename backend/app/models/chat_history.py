# app/models/chat_history.py

from app.db import get_db


class ChatHistory:
    """
    Wrapper around chat_history table with session support.
    Uses raw psycopg2.
    """

    # ── Write ─────────────────────────────────────────────────────────────────

    @staticmethod
    def save_message(
        user_id:       int,
        role:          str,
        content:       str,
        session_id:    str  = None,
        session_title: str  = None,
        is_error:      bool = False,
        is_upgrade:    bool = False,
        is_notice:     bool = False,
    ) -> dict:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            """
            INSERT INTO chat_history
                (user_id, role, content, session_id, session_title,
                 is_error, is_upgrade, is_notice)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, role, content, session_id, session_title,
                      is_error, is_upgrade, is_notice, created_at;
            """,
            (user_id, role, content, session_id, session_title,
             is_error, is_upgrade, is_notice),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        return dict(row)

    # ── Read ──────────────────────────────────────────────────────────────────

    @staticmethod
    def get_history(user_id: int, limit: int = 100, session_id: str = None) -> list[dict]:
        """Return messages for a user (optionally filtered by session)."""
        conn = get_db()
        cur  = conn.cursor()
        if session_id:
            cur.execute(
                """
                SELECT id, role, content, session_id, session_title,
                       is_error, is_upgrade, is_notice, created_at
                FROM   chat_history
                WHERE  user_id = %s AND session_id = %s
                ORDER  BY created_at ASC, id ASC
                LIMIT  %s;
                """,
                (user_id, session_id, limit),
            )
        else:
            cur.execute(
                """
                SELECT id, role, content, session_id, session_title,
                       is_error, is_upgrade, is_notice, created_at
                FROM   chat_history
                WHERE  user_id = %s
                ORDER  BY created_at ASC, id ASC
                LIMIT  %s;
                """,
                (user_id, limit),
            )
        rows = [dict(r) for r in cur.fetchall()]
        cur.close()
        return rows

    @staticmethod
    def get_sessions(user_id: int) -> list[dict]:
        """
        Return one row per session ordered by most recent first.
        Each row: session_id, title, last_message_at, message_count
        Messages with NULL session_id are grouped as 'legacy'.
        """
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            """
            SELECT
                COALESCE(session_id, 'legacy')          AS session_id,
                MAX(session_title)                       AS title,
                MAX(created_at)                          AS last_message_at,
                COUNT(*)                                 AS message_count
            FROM   chat_history
            WHERE  user_id = %s
            GROUP  BY COALESCE(session_id, 'legacy')
            ORDER  BY MAX(created_at) DESC
            LIMIT  50;
            """,
            (user_id,),
        )
        rows = [dict(r) for r in cur.fetchall()]
        cur.close()
        return rows

    @staticmethod
    def get_count(user_id: int) -> int:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM chat_history WHERE user_id = %s;",
            (user_id,),
        )
        count = cur.fetchone()["cnt"]
        cur.close()
        return count

    # ── Delete ────────────────────────────────────────────────────────────────

    @staticmethod
    def clear_history(user_id: int, session_id: str = None) -> int:
        """Delete all messages (or just one session) for a user."""
        conn = get_db()
        cur  = conn.cursor()
        if session_id and session_id != "legacy":
            cur.execute(
                "DELETE FROM chat_history WHERE user_id = %s AND session_id = %s;",
                (user_id, session_id),
            )
        elif session_id == "legacy":
            cur.execute(
                "DELETE FROM chat_history WHERE user_id = %s AND session_id IS NULL;",
                (user_id,),
            )
        else:
            cur.execute(
                "DELETE FROM chat_history WHERE user_id = %s;",
                (user_id,),
            )
        deleted = cur.rowcount
        conn.commit()
        cur.close()
        return deleted
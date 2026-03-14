from app.db import get_db
import json
import psycopg2.extras


class GocharRecord:
    """
    Data-access model for the gochar_records table.
    Plain psycopg2 with RealDictCursor — no ORM.
    """

    def __init__(self, row: dict):
        self.id                  = row["id"]
        self.user_id             = row["user_id"]
        self.natal_lagna_sign_np = row["natal_lagna_sign_np"]
        self.houses              = row["houses"]
        self.transit_details     = row["transit_details"]
        self.calculated_at       = row["calculated_at"]
        self.updated_at          = row["updated_at"]

    def to_gochar_dict(self) -> dict:
        """Return full gochar dict — same shape as API response."""
        return {
            "natal_lagna": {
                "sign_np": self.natal_lagna_sign_np,
            },
            "houses":          self.houses,
            "transit_details": self.transit_details,
            "as_of":           self.calculated_at.strftime("%Y-%m-%d %H:%M UTC")
                               if self.calculated_at else "",
        }

    @classmethod
    def find_by_user(cls, user_id: int) -> "GocharRecord | None":
        db  = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT * FROM gochar_records WHERE user_id = %s LIMIT 1",
            (user_id,)
        )
        row = cur.fetchone()
        cur.close()
        return cls(row) if row else None

    @classmethod
    def upsert(cls, user_id: int, data: dict) -> "GocharRecord":
        db  = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            """
            INSERT INTO gochar_records (
                user_id,
                natal_lagna_sign_np,
                houses, transit_details
            ) VALUES (
                %s, %s, %s, %s
            )
            ON CONFLICT (user_id) DO UPDATE SET
                natal_lagna_sign_np = EXCLUDED.natal_lagna_sign_np,
                houses              = EXCLUDED.houses,
                transit_details     = EXCLUDED.transit_details,
                updated_at          = NOW(),
                calculated_at       = NOW()
            RETURNING *
            """,
            (
                user_id,
                data["natal_lagna"]["sign_np"],
                json.dumps(data["houses"],          ensure_ascii=False),
                json.dumps(data["transit_details"], ensure_ascii=False),
            )
        )
        db.commit()
        row = cur.fetchone()
        cur.close()
        return cls(row)

    def delete(self) -> None:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            "DELETE FROM gochar_records WHERE user_id = %s",
            (self.user_id,)
        )
        db.commit()
        cur.close()
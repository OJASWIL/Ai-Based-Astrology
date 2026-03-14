from app.db import get_db
import json
import psycopg2.extras


class JanmaKundaliRecord:
    """
    Data-access model for the janma_kundali_records table.
    Plain psycopg2 with RealDictCursor — no ORM.
    """

    def __init__(self, row: dict):
        self.id                  = row["id"]
        self.user_id             = row["user_id"]
        self.lagna_sign_np       = row["lagna_sign_np"]
        self.lagna_degree        = row["lagna_degree"]
        self.rashi_sign_np       = row["rashi_sign_np"]
        self.nakshatra           = row["nakshatra"]
        self.nakshatra_pada      = row["nakshatra_pada"]
        self.houses              = row["houses"]
        self.planetary_positions = row["planetary_positions"]
        self.dasha               = row["dasha"]
        self.yogas               = row["yogas"]
        self.calculated_at       = row["calculated_at"]
        self.updated_at          = row["updated_at"]

    def to_kundali_dict(self, birth_info: dict) -> dict:
        """Return full kundali dict — same shape as the original API response."""
        return {
            "birth_info": birth_info,
            "lagna": {
                "sign_np": self.lagna_sign_np,
                "degree":  self.lagna_degree,
            },
            "rashi": {
                "sign_np": self.rashi_sign_np,
            },
            "nakshatra":           self.nakshatra,
            "nakshatra_pada":      self.nakshatra_pada,
            "houses":              self.houses,
            "planetary_positions": self.planetary_positions,
            "dasha":               self.dasha,
            "yogas":               self.yogas,
        }

    @classmethod
    def find_by_user(cls, user_id: int) -> "JanmaKundaliRecord | None":
        db  = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT * FROM janma_kundali_records WHERE user_id = %s LIMIT 1",
            (user_id,)
        )
        row = cur.fetchone()
        cur.close()
        return cls(row) if row else None

    @classmethod
    def upsert(cls, user_id: int, data: dict) -> "JanmaKundaliRecord":
        """Insert or update the kundali record for a user."""
        db  = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            """
            INSERT INTO janma_kundali_records (
                user_id,
                lagna_sign_np, lagna_degree,
                rashi_sign_np,
                nakshatra, nakshatra_pada,
                houses, planetary_positions, dasha, yogas
            ) VALUES (
                %s,
                %s, %s,
                %s,
                %s, %s,
                %s, %s, %s, %s
            )
            ON CONFLICT (user_id) DO UPDATE SET
                lagna_sign_np       = EXCLUDED.lagna_sign_np,
                lagna_degree        = EXCLUDED.lagna_degree,
                rashi_sign_np       = EXCLUDED.rashi_sign_np,
                nakshatra           = EXCLUDED.nakshatra,
                nakshatra_pada      = EXCLUDED.nakshatra_pada,
                houses              = EXCLUDED.houses,
                planetary_positions = EXCLUDED.planetary_positions,
                dasha               = EXCLUDED.dasha,
                yogas               = EXCLUDED.yogas,
                updated_at          = NOW()
            RETURNING *
            """,
            (
                user_id,
                data["lagna"]["sign_np"],
                data["lagna"]["degree"],
                data["rashi"]["sign_np"],
                data["nakshatra"],
                data["nakshatra_pada"],
                json.dumps(data["houses"],              ensure_ascii=False),
                json.dumps(data["planetary_positions"], ensure_ascii=False),
                json.dumps(data["dasha"],               ensure_ascii=False),
                json.dumps(data["yogas"],               ensure_ascii=False),
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
            "DELETE FROM janma_kundali_records WHERE user_id = %s",
            (self.user_id,)
        )
        db.commit()
        cur.close()
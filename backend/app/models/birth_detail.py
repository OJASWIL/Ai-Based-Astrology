from app.db import get_db


class BirthDetail:
    """
    Data-access model for the birth_details table.
    Plain psycopg2 with RealDictCursor — no ORM.
    """

    def __init__(self, row: dict):
        self.id          = row["id"]
        self.user_id     = row["user_id"]
        self.full_name   = row["full_name"]
        self.gender      = row["gender"]
        self.birth_date  = row["birth_date"]
        self.birth_time  = row["birth_time"]
        self.birth_place = row["birth_place"]
        self.latitude    = row["latitude"]
        self.longitude   = row["longitude"]
        self.created_at  = row["created_at"]
        self.updated_at  = row["updated_at"]

    def to_dict(self) -> dict:
        return {
            "id":          self.id,
            "user_id":     self.user_id,
            "full_name":   self.full_name,
            "gender":      self.gender,
            "birth_date":  str(self.birth_date),
            "birth_time":  str(self.birth_time),
            "birth_place": self.birth_place,
            "latitude":    float(self.latitude),
            "longitude":   float(self.longitude),
            "created_at":  str(self.created_at),
            "updated_at":  str(self.updated_at),
        }

    # -------------------------------------------------------------------------
    # Write
    # -------------------------------------------------------------------------

    @staticmethod
    def create(user_id: int, full_name: str, gender: str, birth_date: str,
               birth_time: str, birth_place: str, latitude: float,
               longitude: float) -> "BirthDetail":
        """Insert a new record and return a BirthDetail instance."""
        conn = get_db()
        cur  = conn.cursor()
        try:
            cur.execute("""
                INSERT INTO birth_details
                    (user_id, full_name, gender, birth_date, birth_time,
                     birth_place, latitude, longitude)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING
                    id, user_id, full_name, gender, birth_date, birth_time,
                    birth_place, latitude, longitude, created_at, updated_at
            """, (user_id, full_name, gender, birth_date, birth_time,
                  birth_place, latitude, longitude))
            row = cur.fetchone()
            conn.commit()
            return BirthDetail(row)
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

    @staticmethod
    def upsert(user_id: int, full_name: str, gender: str, birth_date: str,
               birth_time: str, birth_place: str, latitude: float,
               longitude: float) -> "BirthDetail":
        """
        INSERT … ON CONFLICT DO UPDATE — single atomic query.
        Avoids the find → branch → update race condition in the old version.
        user_id has a UNIQUE constraint on birth_details table.
        """
        conn = get_db()
        cur  = conn.cursor()
        try:
            cur.execute("""
                INSERT INTO birth_details
                    (user_id, full_name, gender, birth_date, birth_time,
                     birth_place, latitude, longitude)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    full_name   = EXCLUDED.full_name,
                    gender      = EXCLUDED.gender,
                    birth_date  = EXCLUDED.birth_date,
                    birth_time  = EXCLUDED.birth_time,
                    birth_place = EXCLUDED.birth_place,
                    latitude    = EXCLUDED.latitude,
                    longitude   = EXCLUDED.longitude,
                    updated_at  = CURRENT_TIMESTAMP
                RETURNING
                    id, user_id, full_name, gender, birth_date, birth_time,
                    birth_place, latitude, longitude, created_at, updated_at
            """, (user_id, full_name, gender, birth_date, birth_time,
                  birth_place, latitude, longitude))
            row = cur.fetchone()
            conn.commit()
            return BirthDetail(row)
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

    def update(self, **fields) -> "BirthDetail":
        """
        Update allowed fields on this record.

        FIX: columns and values are zipped together from the same ordered
        list so SET clause and %s placeholders always match correctly.
        """
        allowed = {"full_name", "gender", "birth_date", "birth_time",
                   "birth_place", "latitude", "longitude"}

        # Build parallel lists so order is guaranteed to match
        columns = [k for k in fields if k in allowed]
        values  = [fields[k] for k in columns]

        if not columns:
            return self

        set_clause = ", ".join(f"{col} = %s" for col in columns)
        values.append(self.id)   # for WHERE id = %s

        conn = get_db()
        cur  = conn.cursor()
        try:
            cur.execute(f"""
                UPDATE birth_details
                SET {set_clause}, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND user_id = %s
                RETURNING
                    id, user_id, full_name, gender, birth_date, birth_time,
                    birth_place, latitude, longitude, created_at, updated_at
            """, values + [self.user_id])   # AND user_id = %s safety check
            row = cur.fetchone()
            conn.commit()
            if row is None:
                raise ValueError(
                    f"Update failed: record {self.id} not found "
                    f"or does not belong to user {self.user_id}"
                )
            return BirthDetail(row)
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

    # -------------------------------------------------------------------------
    # Read
    # -------------------------------------------------------------------------

    @staticmethod
    def find_by_user(user_id: int) -> "BirthDetail | None":
        """Return the single birth_details record for this user only."""
        conn = get_db()
        cur  = conn.cursor()
        try:
            cur.execute("""
                SELECT id, user_id, full_name, gender, birth_date, birth_time,
                       birth_place, latitude, longitude, created_at, updated_at
                FROM   birth_details
                WHERE  user_id = %s
                LIMIT  1
            """, (user_id,))
            row = cur.fetchone()
            return BirthDetail(row) if row else None
        finally:
            cur.close()

    @staticmethod
    def find_by_id(record_id: int, user_id: int) -> "BirthDetail | None":
        """Return a record only if it belongs to user_id (ownership check)."""
        conn = get_db()
        cur  = conn.cursor()
        try:
            cur.execute("""
                SELECT id, user_id, full_name, gender, birth_date, birth_time,
                       birth_place, latitude, longitude, created_at, updated_at
                FROM   birth_details
                WHERE  id = %s AND user_id = %s
            """, (record_id, user_id))
            row = cur.fetchone()
            return BirthDetail(row) if row else None
        finally:
            cur.close()

    # -------------------------------------------------------------------------
    # Delete
    # -------------------------------------------------------------------------

    @staticmethod
    def delete_by_user(user_id: int) -> bool:
        """Delete the birth detail record for this user. Returns True if deleted."""
        conn = get_db()
        cur  = conn.cursor()
        try:
            cur.execute(
                "DELETE FROM birth_details WHERE user_id = %s", (user_id,)
            )
            deleted = cur.rowcount > 0
            conn.commit()
            return deleted
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()
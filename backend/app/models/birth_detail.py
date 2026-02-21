from app.db import get_db


class BirthDetail:
    """
    Data-access model for the birth_details table.
    Mirrors the User model pattern — plain psycopg2, no ORM.
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

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    @staticmethod
    def create(user_id: int, full_name: str, gender: str, birth_date: str,
               birth_time: str, birth_place: str, latitude: float,
               longitude: float) -> "BirthDetail":
        """Insert a new record and return a BirthDetail instance."""
        conn = get_db()
        cur  = conn.cursor()

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
        cur.close()
        return BirthDetail(row)

    @staticmethod
    def upsert(user_id: int, full_name: str, gender: str, birth_date: str,
               birth_time: str, birth_place: str, latitude: float,
               longitude: float) -> "BirthDetail":
        """
        Overwrite if a record already exists for this user,
        otherwise insert fresh. (One record per user policy.)
        """
        existing = BirthDetail.find_by_user(user_id)

        if existing:
            return existing.update(
                full_name=full_name, gender=gender, birth_date=birth_date,
                birth_time=birth_time, birth_place=birth_place,
                latitude=latitude, longitude=longitude,
            )

        return BirthDetail.create(
            user_id=user_id, full_name=full_name, gender=gender,
            birth_date=birth_date, birth_time=birth_time,
            birth_place=birth_place, latitude=latitude, longitude=longitude,
        )

    def update(self, **fields) -> "BirthDetail":
        """Update allowed fields on this record."""
        allowed = {"full_name", "gender", "birth_date", "birth_time",
                   "birth_place", "latitude", "longitude"}

        updates = {k: v for k, v in fields.items() if k in allowed}
        if not updates:
            return self

        set_clause = ", ".join(f"{col} = %s" for col in updates)
        values     = list(updates.values()) + [self.id]

        conn = get_db()
        cur  = conn.cursor()

        cur.execute(f"""
            UPDATE birth_details
            SET {set_clause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING
                id, user_id, full_name, gender, birth_date, birth_time,
                birth_place, latitude, longitude, created_at, updated_at
        """, values)

        row = cur.fetchone()
        conn.commit()
        cur.close()
        return BirthDetail(row)

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    @staticmethod
    def find_by_user(user_id: int) -> "BirthDetail | None":
        """Return the single birth_details record for a user."""
        conn = get_db()
        cur  = conn.cursor()

        cur.execute("""
            SELECT id, user_id, full_name, gender, birth_date, birth_time,
                   birth_place, latitude, longitude, created_at, updated_at
            FROM   birth_details
            WHERE  user_id = %s
            LIMIT  1
        """, (user_id,))

        row = cur.fetchone()
        cur.close()
        return BirthDetail(row) if row else None

    @staticmethod
    def find_by_id(record_id: int, user_id: int) -> "BirthDetail | None":
        """Return a record only if it belongs to user_id (ownership check)."""
        conn = get_db()
        cur  = conn.cursor()

        cur.execute("""
            SELECT id, user_id, full_name, gender, birth_date, birth_time,
                   birth_place, latitude, longitude, created_at, updated_at
            FROM   birth_details
            WHERE  id = %s AND user_id = %s
        """, (record_id, user_id))

        row = cur.fetchone()
        cur.close()
        return BirthDetail(row) if row else None

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    @staticmethod
    def delete_by_user(user_id: int) -> bool:
        """Delete the birth detail record for this user. Returns True if deleted."""
        conn = get_db()
        cur  = conn.cursor()

        cur.execute(
            "DELETE FROM birth_details WHERE user_id = %s", (user_id,)
        )

        deleted = cur.rowcount > 0
        conn.commit()
        cur.close()
        return deleted
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    full_name     = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # Astrology-specific (optional at signup)
    date_of_birth  = db.Column(db.Date,        nullable=True)
    time_of_birth  = db.Column(db.String(10),  nullable=True)   # "HH:MM"
    place_of_birth = db.Column(db.String(200), nullable=True)

    is_active  = db.Column(db.Boolean,  default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    # ── helpers ──────────────────────────────────────────────────────────────

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id":             self.id,
            "full_name":      self.full_name,
            "email":          self.email,
            "date_of_birth":  self.date_of_birth.isoformat()  if self.date_of_birth  else None,
            "time_of_birth":  self.time_of_birth,
            "place_of_birth": self.place_of_birth,
            "created_at":     self.created_at.isoformat(),
            "last_login":     self.last_login.isoformat()      if self.last_login     else None,
        }

    def __repr__(self):
        return f"<User {self.email}>"
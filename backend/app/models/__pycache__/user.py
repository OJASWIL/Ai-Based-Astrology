"""
User Model for PostgreSQL database using SQLAlchemy
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class User(db.Model):
    """
    User model representing the users table in PostgreSQL
    """
    __tablename__ = 'users'
    
    # Primary key
    id = db.Column(db.Integer, primary_key=True)
    
    # User credentials
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # User metadata
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """
        Hash and set the user's password using pbkdf2:sha256
        
        Args:
            password (str): Plain text password
        """
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        """
        Verify password against stored hash
        
        Args:
            password (str): Plain text password to verify
            
        Returns:
            bool: True if password matches, False otherwise
        """
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        """
        Update the last login timestamp
        """
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        """
        Convert user object to dictionary (excluding sensitive data)
        
        Returns:
            dict: User data without password
        """
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active
        }
    
    @staticmethod
    def find_by_email(email):
        """
        Find user by email address
        
        Args:
            email (str): Email address to search
            
        Returns:
            User: User object if found, None otherwise
        """
        return User.query.filter_by(email=email.lower()).first()
    
    @staticmethod
    def create_user(email, password):
        """
        Create a new user with hashed password
        
        Args:
            email (str): User's email address
            password (str): User's plain text password
            
        Returns:
            User: Newly created user object
        """
        user = User(email=email.lower())
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user
"""
JWT token generation and verification utilities
"""
import jwt
from datetime import datetime, timedelta
from flask import current_app
import logging

logger = logging.getLogger(__name__)

def generate_token(user_id, email, expires_in=24):
    """
    Generate a JWT token for user authentication
    
    Args:
        user_id (int): User's database ID
        email (str): User's email address
        expires_in (int): Token expiration time in hours (default: 24)
    
    Returns:
        str: Encoded JWT token
    """
    try:
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': datetime.utcnow() + timedelta(hours=expires_in),
            'iat': datetime.utcnow()
        }
        
        # Get secret key from app config
        secret_key = current_app.config.get('SECRET_KEY')
        
        if not secret_key:
            raise ValueError('SECRET_KEY not configured')
        
        # Encode token
        token = jwt.encode(payload, secret_key, algorithm='HS256')
        
        return token
        
    except Exception as e:
        logger.error(f'Token generation error: {str(e)}')
        raise


def verify_token(token):
    """
    Verify and decode a JWT token
    
    Args:
        token (str): JWT token to verify
    
    Returns:
        dict: Decoded token payload if valid, None otherwise
    """
    try:
        # Get secret key from app config
        secret_key = current_app.config.get('SECRET_KEY')
        
        if not secret_key:
            raise ValueError('SECRET_KEY not configured')
        
        # Decode and verify token
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.warning('Token has expired')
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f'Invalid token: {str(e)}')
        return None
    except Exception as e:
        logger.error(f'Token verification error: {str(e)}')
        return None


def refresh_token(token):
    """
    Generate a new token from an existing valid token
    
    Args:
        token (str): Current valid JWT token
    
    Returns:
        str: New JWT token with extended expiration
    """
    try:
        # Verify current token
        payload = verify_token(token)
        
        if not payload:
            return None
        
        # Generate new token with same user data
        new_token = generate_token(payload['user_id'], payload['email'])
        
        return new_token
        
    except Exception as e:
        logger.error(f'Token refresh error: {str(e)}')
        return None
"""
Input validation utilities for email and password
"""
import re

def validate_email(email):
    """
    Validate email format using regex
    
    Args:
        email (str): Email address to validate
    
    Returns:
        bool: True if valid, False otherwise
    """
    if not email:
        return False
    
    # RFC 5322 simplified email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    return re.match(pattern, email) is not None


def validate_password(password):
    """
    Validate password strength
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    
    Args:
        password (str): Password to validate
    
    Returns:
        tuple: (bool, str) - (is_valid, error_message)
    """
    if not password:
        return False, 'Password is required'
    
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long'
    
    if len(password) > 128:
        return False, 'Password must not exceed 128 characters'
    
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter'
    
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter'
    
    if not re.search(r'\d', password):
        return False, 'Password must contain at least one number'
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, 'Password must contain at least one special character'
    
    return True, None
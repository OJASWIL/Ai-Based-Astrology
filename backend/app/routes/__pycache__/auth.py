"""
Authentication routes for user login, logout, and token management
"""
from flask import Blueprint, request, jsonify
from app.models.user import User
from app.utils.token import generate_token, verify_token
from app.utils.validators import validate_email, validate_password
from functools import wraps
import logging

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Setup logging
logger = logging.getLogger(__name__)

def token_required(f):
    """
    Decorator to protect routes that require authentication
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Verify token
            user_data = verify_token(token)
            if not user_data:
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            # Add user data to request context
            request.user = user_data
            
        except Exception as e:
            logger.error(f'Token verification error: {str(e)}')
            return jsonify({'error': 'Token verification failed'}), 401
        
        return f(*args, **kwargs)
    
    return decorated


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Handle user login with email and password
    
    Expected JSON payload:
    {
        "email": "user@example.com",
        "password": "securepassword"
    }
    
    Returns:
        JSON response with token and user data or error message
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract and validate email
        email = data.get('email', '').strip()
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Extract and validate password
        password = data.get('password', '')
        if not password:
            return jsonify({'error': 'Password is required'}), 400
        
        # Find user by email
        user = User.find_by_email(email)
        
        if not user:
            # Use generic error message to prevent email enumeration
            logger.warning(f'Login attempt for non-existent user: {email}')
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f'Login attempt for inactive user: {email}')
            return jsonify({'error': 'Account is inactive'}), 401
        
        # Verify password
        if not user.check_password(password):
            logger.warning(f'Failed login attempt for user: {email}')
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Update last login timestamp
        user.update_last_login()
        
        # Generate session token (JWT)
        token = generate_token(user.id, user.email)
        
        # Log successful login
        logger.info(f'Successful login for user: {email}')
        
        # Return success response
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f'Login error: {str(e)}')
        return jsonify({'error': 'An error occurred during login'}), 500


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Handle user registration
    
    Expected JSON payload:
    {
        "email": "user@example.com",
        "password": "securepassword"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validate email
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        password_valid, password_error = validate_password(password)
        if not password_valid:
            return jsonify({'error': password_error}), 400
        
        # Check if user already exists
        if User.find_by_email(email):
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user
        user = User.create_user(email, password)
        
        # Generate token
        token = generate_token(user.id, user.email)
        
        logger.info(f'New user registered: {email}')
        
        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f'Registration error: {str(e)}')
        return jsonify({'error': 'An error occurred during registration'}), 500


@auth_bp.route('/verify', methods=['GET'])
@token_required
def verify():
    """
    Verify if a token is valid and return user data
    Protected route example
    """
    try:
        user = User.query.get(request.user['user_id'])
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 404
        
        return jsonify({
            'message': 'Token is valid',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f'Verification error: {str(e)}')
        return jsonify({'error': 'Verification failed'}), 500


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """
    Handle user logout
    Note: With JWT, actual logout is handled client-side by removing the token
    This endpoint can be used for logging purposes or token blacklisting
    """
    try:
        logger.info(f'User logged out: {request.user["email"]}')
        
        return jsonify({
            'message': 'Logout successful'
        }), 200
        
    except Exception as e:
        logger.error(f'Logout error: {str(e)}')
        return jsonify({'error': 'Logout failed'}), 500
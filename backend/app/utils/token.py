from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity
from functools import wraps
from flask_jwt_extended import jwt_required
from flask import jsonify


def generate_tokens(user_id: int) -> dict:
    """Return a dict with access_token and refresh_token for a given user id."""
    identity = str(user_id)
    return {
        "access_token":  create_access_token(identity=identity),
        "refresh_token": create_refresh_token(identity=identity),
    }


def get_current_user_id() -> int:
    """Shortcut to get the current user's integer id from the JWT."""
    return int(get_jwt_identity())


def token_required(fn):
    """Decorator — same as @jwt_required() but named consistently with your codebase."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper
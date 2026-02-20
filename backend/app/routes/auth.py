from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app import db
from app.models.user import User
from app.utils.validators import validate_signup_payload, validate_email
from app.utils.token import generate_tokens, get_current_user_id

auth_bp = Blueprint("auth", __name__)


# ─── SIGNUP ──────────────────────────────────────────────────────────────────

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}

    # Validate
    valid, msg = validate_signup_payload(data)
    if not valid:
        return jsonify({"error": msg}), 400

    email = data["email"].strip().lower()

    # Duplicate check
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    # Build user
    user = User(
        full_name=data["full_name"].strip(),
        email=email,
    )
    user.set_password(data["password"])

    # Optional astrology fields
    if data.get("date_of_birth"):
        try:
            user.date_of_birth = datetime.strptime(data["date_of_birth"], "%Y-%m-%d").date()
        except ValueError:
            pass   # silently ignore bad date format

    user.time_of_birth  = data.get("time_of_birth")  or None
    user.place_of_birth = data.get("place_of_birth") or None

    db.session.add(user)
    db.session.commit()

    tokens = generate_tokens(user.id)

    return jsonify({
        "message": "Account created successfully",
        "user":    user.to_dict(),
        **tokens,
    }), 201


# ─── LOGIN ────────────────────────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email")    or "").strip().lower()
    password = (data.get("password") or "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Your account has been deactivated. Contact support."}), 403

    user.last_login = datetime.utcnow()
    db.session.commit()

    tokens = generate_tokens(user.id)

    return jsonify({
        "message": "Login successful",
        "user":    user.to_dict(),
        **tokens,
    }), 200


# ─── GET CURRENT USER ─────────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_current_user_id()
    user    = User.query.get(user_id)

    if not user or not user.is_active:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200


# ─── REFRESH ─────────────────────────────────────────────────────────────────

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id      = get_jwt_identity()
    access_token = generate_tokens(int(user_id))["access_token"]
    return jsonify({"access_token": access_token}), 200


# ─── LOGOUT ──────────────────────────────────────────────────────────────────

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    # JWT is stateless – client must delete tokens.
    # Add a blocklist here if you need server-side invalidation.
    return jsonify({"message": "Logged out successfully"}), 200
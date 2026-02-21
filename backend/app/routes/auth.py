from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash

from app.models.user import User
from app.utils.validators import validate_signup_payload
from app.utils.token import generate_tokens, get_current_user_id

auth_bp = Blueprint("auth", __name__)


# ─── SIGNUP ───────────────────────────────────────────────────────────────────

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}

    valid, msg = validate_signup_payload(data)
    if not valid:
        return jsonify({"error": msg}), 400

    email = data["email"].strip().lower()

    # Duplicate check
    if User.find_by_email(email):
        return jsonify({"error": "An account with this email already exists"}), 409

    # Hash password
    password = generate_password_hash(data["password"])

    user = User.create(
        full_name     = data["full_name"].strip(),
        email         = email,
        password = password,
    )

    tokens = generate_tokens(user.id)
    return jsonify({"message": "Account created successfully", "user": user.to_dict(), **tokens}), 201


# ─── LOGIN ────────────────────────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email")    or "").strip().lower()
    password = (data.get("password") or "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.find_by_email(email)

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Your account has been deactivated. Contact support."}), 403

    user.update_last_login()

    tokens = generate_tokens(user.id)
    return jsonify({"message": "Login successful", "user": user.to_dict(), **tokens}), 200


# ─── GET CURRENT USER ─────────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_current_user_id()
    user    = User.find_by_id(user_id)

    if not user or not user.is_active:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200


# ─── REFRESH ──────────────────────────────────────────────────────────────────

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id      = get_jwt_identity()
    access_token = generate_tokens(int(user_id))["access_token"]
    return jsonify({"access_token": access_token}), 200


# ─── LOGOUT ───────────────────────────────────────────────────────────────────

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Logged out successfully"}), 200
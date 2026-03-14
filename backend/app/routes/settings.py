from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from werkzeug.security import generate_password_hash
from app.models.user import User
from app.utils.token import get_current_user_id

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("", methods=["GET"])
@jwt_required()
def get_settings():
    user = User.find_by_id(get_current_user_id())
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "name":     user.full_name,
        "email":    user.email,
        "language": user.language,
        "timezone": user.timezone,
    }), 200


@settings_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = User.find_by_id(get_current_user_id())
    if not user:
        return jsonify({"error": "User not found"}), 404
    data  = request.get_json(silent=True) or {}
    name  = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400
    if "@" not in email or "." not in email:
        return jsonify({"error": "Invalid email address"}), 400
    if email != user.email:
        existing = User.find_by_email(email)
        if existing and existing.id != user.id:
            return jsonify({"error": "Email already in use"}), 409
    user.update_profile(full_name=name, email=email)
    return jsonify({
        "message": "Profile updated successfully",
        "name":    user.full_name,
        "email":   user.email,
    }), 200


@settings_bp.route("/password", methods=["PUT"])
@jwt_required()
def change_password():
    user = User.find_by_id(get_current_user_id())
    if not user:
        return jsonify({"error": "User not found"}), 404
    data             = request.get_json(silent=True) or {}
    current_password = data.get("current_password", "")
    new_password     = data.get("new_password", "")
    if not current_password or not new_password:
        return jsonify({"error": "Both passwords are required"}), 400
    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 400
    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if current_password == new_password:
        return jsonify({"error": "New password must differ from current"}), 400
    user.update_password(generate_password_hash(new_password))
    return jsonify({"message": "Password changed successfully"}), 200


@settings_bp.route("/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    user = User.find_by_id(get_current_user_id())
    if not user:
        return jsonify({"error": "User not found"}), 404
    data     = request.get_json(silent=True) or {}
    language = data.get("language", "")
    timezone = data.get("timezone", "")
    if language not in {"nepali", "english", "hindi"}:
        return jsonify({"error": "Invalid language"}), 400
    if timezone not in {"asia-kathmandu", "asia-kolkata", "utc"}:
        return jsonify({"error": "Invalid timezone"}), 400
    user.update_preferences(language=language, timezone=timezone)
    return jsonify({"message": "Preferences updated"}), 200


@settings_bp.route("/account", methods=["DELETE"])
@jwt_required()
def delete_account():
    user = User.find_by_id(get_current_user_id())
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.delete()
    return jsonify({"message": "Account deleted"}), 200
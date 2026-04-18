from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

from app.models.user import User
from app.utils.validators import validate_signup_payload
from app.utils.token import generate_tokens, get_current_user_id

auth_bp = Blueprint("auth", __name__)

# ─── Email Helper ─────────────────────────────────────────────────────────────

def send_reset_email(to_email: str, reset_url: str):
    smtp_email    = os.environ.get("SMTP_EMAIL", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    smtp_host     = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port     = int(os.environ.get("SMTP_PORT", 587))

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Password Reset - Jyotish AI"
    msg["From"]    = smtp_email
    msg["To"]      = to_email

    html = f"""
    <html><body>
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="{reset_url}">Reset Password</a>
      <p>This link expires in 30 minutes.</p>
      <p>If you did not request this, ignore this email.</p>
    </body></html>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.sendmail(smtp_email, to_email, msg.as_string())


# ─── SIGNUP ───────────────────────────────────────────────────────────────────

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}

    valid, msg = validate_signup_payload(data)
    if not valid:
        return jsonify({"error": msg}), 400

    email = data["email"].strip().lower()

    if User.find_by_email(email):
        return jsonify({"error": "An account with this email already exists"}), 409

    password = generate_password_hash(data["password"])

    user = User.create(
        full_name=data["full_name"].strip(),
        email=email,
        password=password,
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

    if not user:
        return jsonify({"error": "Account not found"}), 401

    if not user.check_password(password):
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


# ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data  = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.find_by_email(email)

    # Email नभेटिए पनि same response दिनुस् (security best practice)
    if not user:
        return jsonify({"message": "If this email exists, a reset link has been sent"}), 200

    secret       = os.environ.get("SECRET_KEY", "fallback-secret")
    s            = URLSafeTimedSerializer(secret)
    token        = s.dumps(email, salt="password-reset")
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    reset_url    = f"{frontend_url}/reset-password?token={token}"

    try:
        send_reset_email(email, reset_url)
    except Exception as e:
        return jsonify({"error": f"Failed to send email: {str(e)}"}), 500

    return jsonify({"message": "If this email exists, a reset link has been sent"}), 200


# ─── RESET PASSWORD ───────────────────────────────────────────────────────────

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data      = request.get_json(silent=True) or {}
    token     = data.get("token", "")
    password  = data.get("password", "")

    if not token or not password:
        return jsonify({"error": "Token and new password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    secret = os.environ.get("SECRET_KEY", "fallback-secret")
    s      = URLSafeTimedSerializer(secret)

    try:
        email = s.loads(token, salt="password-reset", max_age=1800)  # 30 minutes
    except SignatureExpired:
        return jsonify({"error": "Reset link has expired"}), 400
    except BadSignature:
        return jsonify({"error": "Invalid reset token"}), 400

    user = User.find_by_email(email)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.update_password(generate_password_hash(password))
    return jsonify({"message": "Password reset successfully"}), 200


# ─── LOGOUT ───────────────────────────────────────────────────────────────────

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Logged out successfully"}), 200
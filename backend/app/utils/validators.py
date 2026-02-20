import re


def validate_email(email: str) -> bool:
    pattern = r"^[\w\.\+\-]+@[\w\.-]+\.\w{2,}$"
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Za-z]", password):
        return False, "Password must contain at least one letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    return True, ""


def validate_signup_payload(data: dict) -> tuple[bool, str]:
    full_name = (data.get("full_name") or "").strip()
    email     = (data.get("email")     or "").strip()
    password  = (data.get("password")  or "")

    if not full_name or not email or not password:
        return False, "Full name, email, and password are required"
    if len(full_name) < 2:
        return False, "Full name must be at least 2 characters"
    if not validate_email(email):
        return False, "Please enter a valid email address"

    valid_pw, pw_msg = validate_password(password)
    if not valid_pw:
        return False, pw_msg

    return True, ""
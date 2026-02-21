from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.models.birth_detail import BirthDetail
from app.utils.token import get_current_user_id

birth_bp = Blueprint("birth", __name__)

# ---------------------------------------------------------------------------
# District → default coordinates (Nepal)
# ---------------------------------------------------------------------------
DISTRICT_COORDINATES = {
    "kathmandu":  (27.7172, 85.3240),
    "pokhara":    (28.2096, 83.9856),
    "lalitpur":   (27.6644, 85.3188),
    "bhaktapur":  (27.6710, 85.4298),
    "biratnagar": (26.4525, 87.2718),
    "birgunj":    (27.0104, 84.8774),
    "dharan":     (26.8120, 87.2836),
    "bharatpur":  (27.6833, 84.4333),
    "butwal":     (27.7006, 83.4532),
    "dhangadhi":  (28.6833, 80.5833),
    "nepalgunj":  (28.0500, 81.6167),
    "hetauda":    (27.4167, 85.0333),
    "janakpur":   (26.7288, 85.9266),
    "other":      (28.3949, 84.1240),
}


def _validate_payload(data: dict) -> tuple[bool, str]:
    required = ["fullName", "gender", "birthDate", "birthTime", "birthPlace"]
    for field in required:
        if not data.get(field):
            return False, f"{field} is required"

    if data["gender"].strip().lower() not in ("male", "female", "other"):
        return False, "gender must be male, female, or other"

    return True, ""


def _resolve_coordinates(data: dict, birth_place: str) -> tuple[float, float]:
    """Use provided lat/lng or fall back to district default."""
    try:
        return float(data["latitude"]), float(data["longitude"])
    except (KeyError, TypeError, ValueError):
        return DISTRICT_COORDINATES.get(birth_place, DISTRICT_COORDINATES["other"])


# ─── SAVE / UPDATE BIRTH DETAILS ─────────────────────────────────────────────

@birth_bp.route("/", methods=["POST"])
@jwt_required()
def save_birth_details():
    user_id = get_current_user_id()
    data    = request.get_json(silent=True) or {}

    valid, msg = _validate_payload(data)
    if not valid:
        return jsonify({"error": msg}), 400

    birth_place = data["birthPlace"].strip().lower()
    latitude, longitude = _resolve_coordinates(data, birth_place)

    try:
        detail = BirthDetail.upsert(
            user_id     = user_id,
            full_name   = data["fullName"].strip(),
            gender      = data["gender"].strip().lower(),
            birth_date  = data["birthDate"],
            birth_time  = data["birthTime"],
            birth_place = birth_place,
            latitude    = latitude,
            longitude   = longitude,
        )
        return jsonify({
            "message":      "Birth details saved successfully",
            "birth_detail": detail.to_dict(),
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET BIRTH DETAILS ───────────────────────────────────────────────────────

@birth_bp.route("/", methods=["GET"])
@jwt_required()
def get_birth_details():
    user_id = get_current_user_id()

    try:
        detail = BirthDetail.find_by_user(user_id)

        if not detail:
            return jsonify({"error": "No birth details found"}), 404

        return jsonify({"birth_detail": detail.to_dict()}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── DELETE BIRTH DETAILS ────────────────────────────────────────────────────

@birth_bp.route("/", methods=["DELETE"])
@jwt_required()
def delete_birth_details():
    user_id = get_current_user_id()

    try:
        deleted = BirthDetail.delete_by_user(user_id)

        if not deleted:
            return jsonify({"error": "No birth details found"}), 404

        return jsonify({"message": "Birth details deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── COORDINATES HELPER ──────────────────────────────────────────────────────

@birth_bp.route("/coordinates", methods=["GET"])
def get_coordinates():
    place  = (request.args.get("place") or "").strip().lower()

    if not place:
        return jsonify({"error": "place query param is required"}), 400

    coords = DISTRICT_COORDINATES.get(place, DISTRICT_COORDINATES["other"])
    return jsonify({"latitude": coords[0], "longitude": coords[1]}), 200
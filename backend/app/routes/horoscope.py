from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
import urllib.request, json, time, os
from datetime import datetime

horoscope_bp = Blueprint("horoscope", __name__)

FREE_HOROSCOPE_API_BASE = "https://freehoroscopeapi.com/api/v1/get-horoscope"

# ─── Nepali → English zodiac mapping ───────────────────────────────────────────
RASHI_ZODIAC_MAP = {
    "मेष":      "aries",
    "वृष":      "taurus",
    "मिथुन":   "gemini",
    "कर्कट":   "cancer",
    "सिंह":    "leo",
    "कन्या":   "virgo",
    "तुला":    "libra",
    "वृश्चिक": "scorpio",
    "धनु":     "sagittarius",
    "मकर":     "capricorn",
    "कुम्भ":   "aquarius",
    "मीन":     "pisces",
}

# ─── Full rashi metadata ────────────────────────────────────────────────────────
RASHI_INFO = {
    "मेष": {
        "english": "Aries",       "symbol": "♈",
        "element": "Fire",        "color": "#ef4444",
        "dates": "Mar 21 – Apr 19",
    },
    "वृष": {
        "english": "Taurus",      "symbol": "♉",
        "element": "Earth",       "color": "#84cc16",
        "dates": "Apr 20 – May 20",
    },
    "मिथुन": {
        "english": "Gemini",      "symbol": "♊",
        "element": "Air",         "color": "#f59e0b",
        "dates": "May 21 – Jun 20",
    },
    "कर्कट": {
        "english": "Cancer",      "symbol": "♋",
        "element": "Water",       "color": "#06b6d4",
        "dates": "Jun 21 – Jul 22",
    },
    "सिंह": {
        "english": "Leo",         "symbol": "♌",
        "element": "Fire",        "color": "#f97316",
        "dates": "Jul 23 – Aug 22",
    },
    "कन्या": {
        "english": "Virgo",       "symbol": "♍",
        "element": "Earth",       "color": "#22c55e",
        "dates": "Aug 23 – Sep 22",
    },
    "तुला": {
        "english": "Libra",       "symbol": "♎",
        "element": "Air",         "color": "#ec4899",
        "dates": "Sep 23 – Oct 22",
    },
    "वृश्चिक": {
        "english": "Scorpio",     "symbol": "♏",
        "element": "Water",       "color": "#dc2626",
        "dates": "Oct 23 – Nov 21",
    },
    "धनु": {
        "english": "Sagittarius", "symbol": "♐",
        "element": "Fire",        "color": "#8b5cf6",
        "dates": "Nov 22 – Dec 21",
    },
    "मकर": {
        "english": "Capricorn",   "symbol": "♑",
        "element": "Earth",       "color": "#6366f1",
        "dates": "Dec 22 – Jan 19",
    },
    "कुम्भ": {
        "english": "Aquarius",    "symbol": "♒",
        "element": "Air",         "color": "#3b82f6",
        "dates": "Jan 20 – Feb 18",
    },
    "मीन": {
        "english": "Pisces",      "symbol": "♓",
        "element": "Water",       "color": "#14b8a6",
        "dates": "Feb 19 – Mar 20",
    },
}

# ─── Valid periods ──────────────────────────────────────────────────────────────
VALID_PERIODS = {"daily", "weekly", "monthly"}

# ─── Simple in-memory cache ─────────────────────────────────────────────────────
_cache: dict = {}

# TTL per period type (seconds)
CACHE_TTL = {
    "daily":   3600,       # 1 hour
    "weekly":  86400,      # 24 hours
    "monthly": 86400 * 3,  # 3 days
}


def _cache_get(key: str, period: str):
    entry = _cache.get(key)
    ttl   = CACHE_TTL.get(period, 3600)
    if entry and (time.time() - entry["ts"]) < ttl:
        return entry["data"]
    return None


def _cache_set(key: str, data):
    _cache[key] = {"ts": time.time(), "data": data}


# ─── BS date helper ─────────────────────────────────────────────────────────────
def get_bs_date() -> str:
    today   = datetime.now()
    bs_year = today.year + 57
    return f"वि.सं. {bs_year}, {today.strftime('%B %d')}"


# ─── Fetch from freehoroscopeapi.com ───────────────────────────────────────────
def fetch_free_horoscope(zodiac_en: str, period: str) -> dict:
    """
    Fetch horoscope from freehoroscopeapi.com.
    period must be one of: daily | weekly | monthly
    """
    today     = datetime.now()
    cache_key = f"{zodiac_en}:{period}:{today.strftime('%Y-%m-%d')}"
    cached    = _cache_get(cache_key, period)
    if cached:
        return cached

    url = f"{FREE_HOROSCOPE_API_BASE}/{period}?sign={zodiac_en}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept":     "application/json",
        }
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    _cache_set(cache_key, data)
    return data


# ─── Normalise API response → prediction string ────────────────────────────────
def extract_prediction(api_data: dict, period: str) -> str:
    """
    freehoroscopeapi.com returns different shapes per period.
    Handles the common patterns gracefully.
    """
    # Try top-level keys first
    for key in ("horoscope", "prediction", "description", "text", "data"):
        val = api_data.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
        # data may be a nested dict
        if isinstance(val, dict):
            for inner in ("horoscope", "prediction", "description", "text"):
                inner_val = val.get(inner)
                if isinstance(inner_val, str) and inner_val.strip():
                    return inner_val.strip()

    # Fallback: stringify whatever we got
    return json.dumps(api_data)


# ─── Build standardised response dict ──────────────────────────────────────────
def build_response(rashi: str, api_data: dict, period: str) -> dict:
    info  = RASHI_INFO[rashi]
    today = datetime.now()

    return {
        "rashi":   rashi,
        "english": info["english"],
        "symbol":  info["symbol"],
        "element": info["element"],
        "color":   info["color"],
        "dates":   info["dates"],
        "period":  period,
        "date": {
            "ad":  today.strftime("%Y-%m-%d"),
            "day": today.strftime("%A"),
            "bs":  get_bs_date(),
        },
        "prediction": extract_prediction(api_data, period),
        # freehoroscopeapi may or may not return lucky fields
        "lucky": {
            "color":  api_data.get("lucky_color",  api_data.get("data", {}).get("lucky_color",  "") if isinstance(api_data.get("data"), dict) else ""),
            "number": api_data.get("lucky_number", api_data.get("data", {}).get("lucky_number", "") if isinstance(api_data.get("data"), dict) else ""),
            "day":    api_data.get("lucky_day",    api_data.get("data", {}).get("lucky_day",    "") if isinstance(api_data.get("data"), dict) else ""),
            "month":  api_data.get("lucky_month",  api_data.get("data", {}).get("lucky_month",  "") if isinstance(api_data.get("data"), dict) else ""),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

# ── GET /api/horoscope/?rashi=मेष&period=daily ─────────────────────────────────
@horoscope_bp.route("/", methods=["GET"])
@jwt_required()
def get_horoscope():
    rashi    = request.args.get("rashi",    "मेष").strip()
    period   = request.args.get("period",   "daily").strip().lower()
    language = request.args.get("language", "nepali").strip()

    if rashi not in RASHI_ZODIAC_MAP:
        valid = ", ".join(RASHI_ZODIAC_MAP.keys())
        return jsonify({"error": f"'{rashi}' राशि फेला परेन। Valid: {valid}"}), 404

    if period not in VALID_PERIODS:
        return jsonify({"error": f"period '{period}' मान्य छैन। Valid: {', '.join(VALID_PERIODS)}"}), 400

    try:
        zodiac_en = RASHI_ZODIAC_MAP[rashi]
        api_data  = fetch_free_horoscope(zodiac_en, period)
        horoscope = build_response(rashi, api_data, period)
        return jsonify({"horoscope": horoscope}), 200

    except Exception as e:
        return jsonify({"error": f"राशिफल ल्याउन सकिएन: {str(e)}"}), 503


# ── GET /api/horoscope/all?period=weekly  →  सबै 12 ओटै ───────────────────────
@horoscope_bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_horoscope():
    period   = request.args.get("period",   "daily").strip().lower()
    language = request.args.get("language", "nepali").strip()

    if period not in VALID_PERIODS:
        return jsonify({"error": f"period '{period}' मान्य छैन। Valid: {', '.join(VALID_PERIODS)}"}), 400

    today  = datetime.now()
    result = {}

    for rashi in RASHI_ZODIAC_MAP:
        zodiac_en = RASHI_ZODIAC_MAP[rashi]
        info      = RASHI_INFO[rashi]

        try:
            api_data = fetch_free_horoscope(zodiac_en, period)
            entry    = build_response(rashi, api_data, period)
            result[rashi] = entry

        except Exception as e:
            result[rashi] = {
                "rashi":      rashi,
                "english":    info["english"],
                "symbol":     info["symbol"],
                "element":    info["element"],
                "color":      info["color"],
                "dates":      info["dates"],
                "period":     period,
                "prediction": "",
                "lucky":      {"color": "", "number": "", "day": "", "month": ""},
                "error":      f"fetch failed: {str(e)}",
            }

        time.sleep(0.2)   # be polite to the free API

    return jsonify({
        "date":       today.strftime("%Y-%m-%d"),
        "period":     period,
        "total":      len(result),
        "horoscopes": result,
    }), 200


# ── GET /api/horoscope/list  →  static metadata only ──────────────────────────
@horoscope_bp.route("/list", methods=["GET"])
@jwt_required()
def get_rashi_list():
    data = [
        {
            "rashi":   rashi,
            "english": info["english"],
            "symbol":  info["symbol"],
            "element": info["element"],
            "color":   info["color"],
            "dates":   info["dates"],
        }
        for rashi, info in RASHI_INFO.items()
    ]
    return jsonify({"rashis": data, "total": len(data)}), 200


# ─── Error handlers ─────────────────────────────────────────────────────────────
@horoscope_bp.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@horoscope_bp.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
import urllib.request, json, time, os
from datetime import datetime
from pathlib import Path

horoscope_bp = Blueprint("horoscope", __name__)

FREE_HOROSCOPE_API_BASE = "https://freehoroscopeapi.com/api/v1/get-horoscope"

# ─── Nepali → English zodiac mapping ───────────────────────────────────────────
RASHI_ZODIAC_MAP = {
    "मेष": "aries",
    "वृष": "taurus",
    "मिथुन": "gemini",
    "कर्कट": "cancer",
    "सिंह": "leo",
    "कन्या": "virgo",
    "तुला": "libra",
    "वृश्चिक": "scorpio",
    "धनु": "sagittarius",
    "मकर": "capricorn",
    "कुम्भ": "aquarius",
    "मीन": "pisces",
}

# ─── Full rashi metadata ────────────────────────────────────────────────────────
RASHI_INFO = {
    "मेष": {
        "english": "Aries", "symbol": "♈", "element": "Fire", "element_ne": "अग्नि",
        "color": "#ef4444", "dates": "Mar 21 – Apr 19", "dates_ne": "मार्च २१ – अप्रिल १९",
    },
    "वृष": {
        "english": "Taurus", "symbol": "♉", "element": "Earth", "element_ne": "पृथ्वी",
        "color": "#84cc16", "dates": "Apr 20 – May 20", "dates_ne": "अप्रिल २० – मे २०",
    },
    "मिथुन": {
        "english": "Gemini", "symbol": "♊", "element": "Air", "element_ne": "वायु",
        "color": "#f59e0b", "dates": "May 21 – Jun 20", "dates_ne": "मे २१ – जुन २०",
    },
    "कर्कट": {
        "english": "Cancer", "symbol": "♋", "element": "Water", "element_ne": "जल",
        "color": "#06b6d4", "dates": "Jun 21 – Jul 22", "dates_ne": "जुन २१ – जुलाई २२",
    },
    "सिंह": {
        "english": "Leo", "symbol": "♌", "element": "Fire", "element_ne": "अग्नि",
        "color": "#f97316", "dates": "Jul 23 – Aug 22", "dates_ne": "जुलाई २३ – अगस्ट २२",
    },
    "कन्या": {
        "english": "Virgo", "symbol": "♍", "element": "Earth", "element_ne": "पृथ्वी",
        "color": "#22c55e", "dates": "Aug 23 – Sep 22", "dates_ne": "अगस्ट २३ – सेप्टेम्बर २२",
    },
    "तुला": {
        "english": "Libra", "symbol": "♎", "element": "Air", "element_ne": "वायु",
        "color": "#ec4899", "dates": "Sep 23 – Oct 22", "dates_ne": "सेप्टेम्बर २३ – अक्टोबर २२",
    },
    "वृश्चिक": {
        "english": "Scorpio", "symbol": "♏", "element": "Water", "element_ne": "जल",
        "color": "#dc2626", "dates": "Oct 23 – Nov 21", "dates_ne": "अक्टोबर २३ – नोभेम्बर २१",
    },
    "धनु": {
        "english": "Sagittarius", "symbol": "♐", "element": "Fire", "element_ne": "अग्नि",
        "color": "#8b5cf6", "dates": "Nov 22 – Dec 21", "dates_ne": "नोभेम्बर २२ – डिसेम्बर २१",
    },
    "मकर": {
        "english": "Capricorn", "symbol": "♑", "element": "Earth", "element_ne": "पृथ्वी",
        "color": "#6366f1", "dates": "Dec 22 – Jan 19", "dates_ne": "डिसेम्बर २२ – जनवरी १९",
    },
    "कुम्भ": {
        "english": "Aquarius", "symbol": "♒", "element": "Air", "element_ne": "वायु",
        "color": "#3b82f6", "dates": "Jan 20 – Feb 18", "dates_ne": "जनवरी २० – फेब्रुअरी १८",
    },
    "मीन": {
        "english": "Pisces", "symbol": "♓", "element": "Water", "element_ne": "जल",
        "color": "#14b8a6", "dates": "Feb 19 – Mar 20", "dates_ne": "फेब्रुअरी १९ – मार्च २०",
    },
}

VALID_PERIODS = {"daily", "weekly", "monthly"}

# ─── Static JSON file path for Nepali translations ─────────────────────────────
TRANSLATIONS_FILE = Path(__file__).parent / "horoscope_translations.json"

def load_nepali_translations():
    """Load Nepali translations from JSON file"""
    if TRANSLATIONS_FILE.exists():
        try:
            with open(TRANSLATIONS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading translations: {e}")
            return {}
    else:
        print(f"Translation file not found: {TRANSLATIONS_FILE}")
        return {}

def get_nepali_horoscope(rashi, period):
    """Get Nepali horoscope from static JSON file"""
    translations = load_nepali_translations()
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Try different key formats
    keys_to_try = [
        f"{rashi}:{period}:{today}",
        f"{rashi}:{period}:{today[:7]}",  # For monthly: 2026-04
        f"{rashi}:{period}:2026-04-01",   # Fallback monthly
    ]
    
    for key in keys_to_try:
        if key in translations:
            return translations[key]
    
    # Return None if not found
    return None

# ─── Simple in-memory cache for API responses ──────────────────────────────────
_cache: dict = {}
CACHE_TTL = {"daily": 3600, "weekly": 86400, "monthly": 86400 * 3}

def _cache_get(key: str, period: str):
    entry = _cache.get(key)
    ttl = CACHE_TTL.get(period, 3600)
    if entry and (time.time() - entry["ts"]) < ttl:
        return entry["data"]
    return None

def _cache_set(key: str, data):
    _cache[key] = {"ts": time.time(), "data": data}

# ─── BS date helper ─────────────────────────────────────────────────────────────
def get_bs_date() -> str:
    today = datetime.now()
    bs_year = today.year + 57
    return f"वि.सं. {bs_year}, {today.strftime('%B %d')}"

def translate_day(day_en: str) -> str:
    days = {
        "Monday": "सोमबार", "Tuesday": "मंगलबार", "Wednesday": "बुधबार",
        "Thursday": "बिहिबार", "Friday": "शुक्रबार", "Saturday": "शनिबार",
        "Sunday": "आइतबार",
    }
    return days.get(day_en, day_en)

# ─── Fetch from freehoroscopeapi.com (ENGLISH ONLY) ────────────────────────────
def fetch_free_horoscope(zodiac_en: str, period: str) -> dict:
    """Fetch ENGLISH horoscope from API"""
    today = datetime.now()
    cache_key = f"{zodiac_en}:{period}:{today.strftime('%Y-%m-%d')}"
    cached = _cache_get(cache_key, period)
    if cached:
        return cached

    url = f"{FREE_HOROSCOPE_API_BASE}/{period}?sign={zodiac_en}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    _cache_set(cache_key, data)
    return data

def extract_prediction(api_data: dict) -> str:
    """Extract English prediction from API response"""
    for key in ("horoscope", "prediction", "description", "text", "data"):
        val = api_data.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
        if isinstance(val, dict):
            for inner in ("horoscope", "prediction", "description", "text"):
                inner_val = val.get(inner)
                if isinstance(inner_val, str) and inner_val.strip():
                    return inner_val.strip()
    return json.dumps(api_data)

# ─── Build response (English from API, Nepali from JSON) ───────────────────────
def build_response(rashi: str, api_data: dict, period: str, language: str = "nepali") -> dict:
    info = RASHI_INFO[rashi]
    today = datetime.now()
    
    # Get prediction based on language
    if language == "nepali":
        # Get Nepali from static JSON file
        prediction = get_nepali_horoscope(rashi, period)
        if not prediction:
            prediction = f"क्षमा गर्नुहोस्, {rashi} राशिको {period} राशिफल हाल उपलब्ध छैन।"
        
        period_text = {"daily": "दैनिक", "weekly": "साप्ताहिक", "monthly": "मासिक"}.get(period, period)
        element_text = info["element_ne"]
        dates_text = info["dates_ne"]
        rashi_name = rashi
        day_name = translate_day(today.strftime("%A"))
    else:
        # Get English from API
        prediction = extract_prediction(api_data)
        period_text = period.capitalize()
        element_text = info["element"]
        dates_text = info["dates"]
        rashi_name = info["english"]
        day_name = today.strftime("%A")
    
    return {
        "rashi": rashi_name,
        "symbol": info["symbol"],
        "element": element_text,
        "color": info["color"],
        "dates": dates_text,
        "period": period_text,
        "date": {
            "ad": today.strftime("%Y-%m-%d"),
            "day": day_name,
            "bs": get_bs_date(),
        },
        "prediction": prediction,
        "lucky": {
            "color": api_data.get("lucky_color", api_data.get("data", {}).get("lucky_color", "")),
            "number": api_data.get("lucky_number", api_data.get("data", {}).get("lucky_number", "")),
            "day": api_data.get("lucky_day", api_data.get("data", {}).get("lucky_day", "")),
            "month": api_data.get("lucky_month", api_data.get("data", {}).get("lucky_month", "")),
        } if language == "english" else {
            "color": "", "number": "", "day": "", "month": ""
        }
    }

# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@horoscope_bp.route("/", methods=["GET"])
@jwt_required()
def get_horoscope():
    rashi = request.args.get("rashi", "मेष").strip()
    period = request.args.get("period", "daily").strip().lower()
    language = request.args.get("language", "nepali").strip().lower()

    if rashi not in RASHI_ZODIAC_MAP:
        valid = ", ".join(RASHI_ZODIAC_MAP.keys())
        error = f"'{rashi}' राशि फेला परेन। Valid: {valid}" if language == "nepali" else f"'{rashi}' not found. Valid: {valid}"
        return jsonify({"error": error}), 404

    if period not in VALID_PERIODS:
        error = f"period '{period}' मान्य छैन। Valid: {', '.join(VALID_PERIODS)}" if language == "nepali" else f"period '{period}' invalid. Valid: {', '.join(VALID_PERIODS)}"
        return jsonify({"error": error}), 400

    try:
        zodiac_en = RASHI_ZODIAC_MAP[rashi]
        
        # Always fetch English from API (needed for English response)
        api_data = fetch_free_horoscope(zodiac_en, period)
        
        # Build response based on language
        horoscope = build_response(rashi, api_data, period, language)
        return jsonify({"horoscope": horoscope}), 200

    except Exception as e:
        error = f"राशिफल ल्याउन सकिएन: {str(e)}" if language == "nepali" else f"Failed to fetch horoscope: {str(e)}"
        return jsonify({"error": error}), 503

@horoscope_bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_horoscope():
    period = request.args.get("period", "daily").strip().lower()
    language = request.args.get("language", "nepali").strip().lower()

    if period not in VALID_PERIODS:
        error = f"period '{period}' मान्य छैन। Valid: {', '.join(VALID_PERIODS)}" if language == "nepali" else f"period '{period}' invalid. Valid: {', '.join(VALID_PERIODS)}"
        return jsonify({"error": error}), 400

    today = datetime.now()
    result = {}

    for rashi in RASHI_ZODIAC_MAP:
        try:
            zodiac_en = RASHI_ZODIAC_MAP[rashi]
            api_data = fetch_free_horoscope(zodiac_en, period)
            entry = build_response(rashi, api_data, period, language)
            result[rashi if language == "nepali" else RASHI_INFO[rashi]["english"]] = entry
        except Exception as e:
            info = RASHI_INFO[rashi]
            if language == "nepali":
                prediction = get_nepali_horoscope(rashi, period)
                if not prediction:
                    prediction = f"क्षमा गर्नुहोस्, {rashi} राशिको {period} राशिफल हाल उपलब्ध छैन।"
                result[rashi] = {
                    "rashi": rashi, "symbol": info["symbol"], "element": info["element_ne"],
                    "color": info["color"], "dates": info["dates_ne"], "period": period,
                    "prediction": prediction, "lucky": {"color": "", "number": "", "day": "", "month": ""}
                }
            else:
                result[info["english"]] = {
                    "rashi": info["english"], "symbol": info["symbol"], "element": info["element"],
                    "color": info["color"], "dates": info["dates"], "period": period,
                    "prediction": "", "lucky": {"color": "", "number": "", "day": "", "month": ""},
                    "error": f"fetch failed: {str(e)}"
                }
        time.sleep(0.2)

    return jsonify({
        "date": today.strftime("%Y-%m-%d"),
        "period": period,
        "total": len(result),
        "horoscopes": result,
    }), 200

@horoscope_bp.route("/list", methods=["GET"])
@jwt_required()
def get_rashi_list():
    language = request.args.get("language", "nepali").strip().lower()
    
    data = []
    for rashi, info in RASHI_INFO.items():
        if language == "nepali":
            data.append({
                "rashi": rashi, "english": info["english"], "symbol": info["symbol"],
                "element": info["element_ne"], "color": info["color"], "dates": info["dates_ne"],
            })
        else:
            data.append({
                "rashi": info["english"], "nepali": rashi, "symbol": info["symbol"],
                "element": info["element"], "color": info["color"], "dates": info["dates"],
            })
    return jsonify({"rashis": data, "total": len(data)}), 200

@horoscope_bp.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@horoscope_bp.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500
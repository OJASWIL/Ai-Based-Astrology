from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.utils.token import get_current_user_id
from app.models.janma_kundali import JanmaKundaliRecord
from app.models.birth_detail import BirthDetail
from app.routes.payment import get_premium_status
from app.routes.gochar import _do_calculate
import urllib.request
import json
import re
from datetime import datetime, date
import time
import os

horoscope_bp = Blueprint("horoscope", __name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY_Horoscope", "")  
GROQ_MODEL   = "llama-3.1-8b-instant"                        

# ── Rashi mappings ────────────────────────────────────────────────────────────
RASHI_URL_MAP = {
    "मेष": "Mesh", "वृष": "Brish", "मिथुन": "Mithun", "कर्कट": "Karkat",
    "सिंह": "Singha", "कन्या": "Kanya", "तुला": "Tula", "वृश्चिक": "Brischik",
    "धनु": "Dhanu", "मकर": "Makar", "कुम्भ": "Kumbha", "मीन": "Meen",
}

RASHI_INFO = {
    "मेष":      {"english": "Aries",       "symbol": "♈", "element": "Fire",  "color": "#ef4444"},
    "वृष":      {"english": "Taurus",      "symbol": "♉", "element": "Earth", "color": "#84cc16"},
    "मिथुन":   {"english": "Gemini",      "symbol": "♊", "element": "Air",   "color": "#f59e0b"},
    "कर्कट":   {"english": "Cancer",      "symbol": "♋", "element": "Water", "color": "#06b6d4"},
    "सिंह":    {"english": "Leo",         "symbol": "♌", "element": "Fire",  "color": "#f97316"},
    "कन्या":   {"english": "Virgo",       "symbol": "♍", "element": "Earth", "color": "#22c55e"},
    "तुला":    {"english": "Libra",       "symbol": "♎", "element": "Air",   "color": "#ec4899"},
    "वृश्चिक": {"english": "Scorpio",     "symbol": "♏", "element": "Water", "color": "#dc2626"},
    "धनु":     {"english": "Sagittarius", "symbol": "♐", "element": "Fire",  "color": "#8b5cf6"},
    "मकर":     {"english": "Capricorn",   "symbol": "♑", "element": "Earth", "color": "#6366f1"},
    "कुम्भ":   {"english": "Aquarius",    "symbol": "♒", "element": "Air",   "color": "#3b82f6"},
    "मीन":     {"english": "Pisces",      "symbol": "♓", "element": "Water", "color": "#14b8a6"},
}

_cache: dict = {}
CACHE_TTL        = 3600
CACHE_TTL_YEARLY = 86400


# ── Groq API helper ───────────────────────────────────────────────────────────

def call_groq(prompt: str, max_tokens: int = 2000, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            payload = json.dumps({
                "model": GROQ_MODEL,  # llama-3.1-8b-instant
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {GROQ_API_KEY}"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            raw = body["choices"][0]["message"]["content"].strip()
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$",          "", raw)
            return raw

        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                time.sleep(2 ** attempt)  # 1s → 2s → 4s
                continue
            raise


def parse_json(raw: str) -> dict:
    try:
        return json.loads(raw)
    except Exception:
        return {"error": "JSON parse failed"}


# ── Kundali summary ───────────────────────────────────────────────────────────

def build_kundali_summary(user_id: int) -> str:
    try:
        record = JanmaKundaliRecord.find_by_user(user_id)
        detail = BirthDetail.find_by_user(user_id)
        if not record or not detail:
            return ""

        current_dasha = ""
        if record.dasha:
            for d in record.dasha:
                if d.get("current"):
                    current_dasha = d.get("planet_np", "")
                    break

        planet_lines = []
        if record.planetary_positions:
            for p in record.planetary_positions[:5]:
                planet_lines.append(f"{p.get('planet_np')} {p.get('sign_np')} मा")

        yoga_names = []
        if record.yogas:
            yoga_names = [y.get("name", "") for y in record.yogas[:3]]

        return f"""जन्म विवरण:
- जन्म मिति: {detail.birth_date}
- जन्म समय: {str(detail.birth_time)[:5]}
- जन्म स्थान: {detail.birth_place}
- लग्न: {record.lagna_sign_np}
- राशि: {record.rashi_sign_np}
- नक्षत्र: {record.nakshatra} (पाद {record.nakshatra_pada})
- वर्तमान महादशा: {current_dasha}
- ग्रह स्थिति: {', '.join(planet_lines)}
- योगहरू: {', '.join(yoga_names) if yoga_names else 'सामान्य'}"""
    except Exception:
        return ""


# ── Gochar summary ────────────────────────────────────────────────────────────

def build_gochar_summary(user_id: int) -> str:
    try:
        detail = BirthDetail.find_by_user(user_id)
        if not detail:
            return ""

        gochar_data     = _do_calculate(detail, language="nepali")
        transit_details = gochar_data.get("transit_details", [])
        natal_lagna     = gochar_data.get("natal_lagna", {}).get("sign_np", "")

        lines = [f"वर्तमान गोचर (नाताल लग्न: {natal_lagna}):"]
        for t in transit_details:
            lines.append(
                f"- {t['planet_np']} → भाव {t['gochar_house']} ({t['sign_np']}): "
                f"{t['effect']} — {t['description']}"
            )

        return "\n".join(lines)
    except Exception:
        return ""


# ── Prompt builder ────────────────────────────────────────────────────────────

def _period_label(period: str) -> str:
    return {"daily": "दैनिक", "weekly": "साप्ताहिक",
            "monthly": "मासिक", "yearly": "वार्षिक"}.get(period, period)


def build_prompt(rashi: str, english: str, period: str,
                 bs_year: str, kundali_summary: str = "",
                 gochar_summary: str = "") -> tuple:

    personalized = bool(kundali_summary)
    label        = _period_label(period)

    context = ""
    if kundali_summary:
        context += f"\n\nव्यक्तिगत कुण्डली:\n{kundali_summary}"
    if gochar_summary:
        context += f"\n\n{gochar_summary}"

    personal_note = ""
    if personalized:
        personal_note = "माथिको ग्रह स्थिति, दशा, लग्न, नक्षत्र र वर्तमान गोचरलाई आधार मानेर व्यक्तिगत फलादेश दिनुहोस्।\n\n"

    if period == "yearly":
        prompt = f"""तपाईं एक अनुभवी नेपाली ज्योतिषी हुनुहुन्छ। विक्रम संवत् {bs_year} को लागि {rashi} ({english}) राशिको {label} राशिफल लेख्नुहोस्।{context}

{personal_note}JSON मात्र दिनुहोस्, अरू केही नलेख्नुहोस्:
{{
  "prediction": "३-४ वाक्यको समग्र वार्षिक सारांश",
  "monthly_breakdown": {{
    "वैशाख": "फलादेश","जेठ": "फलादेश","असार": "फलादेश","साउन": "फलादेश",
    "भदौ": "फलादेश","असोज": "फलादेश","कार्तिक": "फलादेश","मङ्सिर": "फलादेश",
    "पुस": "फलादेश","माघ": "फलादेश","फागुन": "फलादेश","चैत": "फलादेश"
  }},
  "career": "कार्यक्षेत्र २-३ वाक्य",
  "love": "प्रेम सम्बन्ध २-३ वाक्य",
  "health": "स्वास्थ्य २-३ वाक्य",
  "education": "शिक्षा २-३ वाक्य",
  "remedy": "शुभ उपाय",
  "lucky_color": "शुभ रंग",
  "lucky_number": "शुभ अंक",
  "lucky_day": "शुभ बार",
  "lucky_month": "शुभ महिना"
}}"""
        return prompt, 3000

    elif period == "monthly":
        prompt = f"""तपाईं एक अनुभवी नेपाली ज्योतिषी हुनुहुन्छ। {rashi} ({english}) राशिको यो महिनाको {label} राशिफल लेख्नुहोस्।{context}

{personal_note}JSON मात्र दिनुहोस्:
{{
  "prediction": "मासिक सारांश ३-४ वाक्य",
  "career": "कार्यक्षेत्र",
  "love": "प्रेम सम्बन्ध",
  "health": "स्वास्थ्य",
  "lucky_color": "शुभ रंग",
  "lucky_number": "शुभ अंक"
}}"""
        return prompt, 1200

    elif period == "weekly":
        prompt = f"""तपाईं एक अनुभवी नेपाली ज्योतिषी हुनुहुन्छ। {rashi} ({english}) राशिको यो हप्ताको {label} राशिफल लेख्नुहोस्।{context}

{personal_note}JSON मात्र दिनुहोस्:
{{
  "prediction": "साप्ताहिक सारांश २-३ वाक्य",
  "lucky_color": "शुभ रंग",
  "lucky_number": "शुभ अंक"
}}"""
        return prompt, 800

    else:  # daily
        prompt = f"""तपाईं एक अनुभवी नेपाली ज्योतिषी हुनुहुन्छ। {rashi} ({english}) राशिको आजको {label} राशिफल लेख्नुहोस्।{context}

{personal_note}JSON मात्र दिनुहोस्:
{{
  "prediction": "आजको फलादेश २-३ वाक्य",
  "lucky_color": "शुभ रंग",
  "lucky_number": "शुभ अंक"
}}"""
        return prompt, 700


# ── Cache key ─────────────────────────────────────────────────────────────────

def make_cache_key(user_id: int, rashi: str, period: str, is_premium: bool) -> str:
    if period == "yearly":
        date_part = datetime.now().strftime("%Y-%m")
    elif period == "weekly":
        date_part = date.today().strftime("%Y-W%W")
    else:
        date_part = datetime.now().strftime("%Y-%m-%d")

    if is_premium:
        return f"prem_{user_id}_{period}_{date_part}"
    else:
        return f"free_{rashi}_{period}_{date_part}"


# ── Response builder ──────────────────────────────────────────────────────────

def build_response(rashi: str, period: str, ai_data: dict,
                   bs_year: str, bs_date: str, is_premium: bool) -> dict:
    info  = RASHI_INFO[rashi]
    today = datetime.now()

    resp = {
        "rashi": rashi, "english": info["english"], "symbol": info["symbol"],
        "element": info["element"], "color": info["color"],
        "period": period, "is_premium": is_premium,
        "date": {
            "ad":  today.strftime("%Y-%m-%d"),
            "day": today.strftime("%A"),
            "bs":  bs_date,
        },
        "prediction": ai_data.get("prediction", ""),
        "lucky": {
            "color":  ai_data.get("lucky_color", ""),
            "number": ai_data.get("lucky_number", ""),
            "day":    ai_data.get("lucky_day", ""),
            "month":  ai_data.get("lucky_month", ""),
        },
    }

    if period == "yearly":
        resp["monthly_breakdown"] = ai_data.get("monthly_breakdown", {})
        resp["career"]    = ai_data.get("career", "")
        resp["love"]      = ai_data.get("love", "")
        resp["health"]    = ai_data.get("health", "")
        resp["education"] = ai_data.get("education", "")
        resp["remedy"]    = ai_data.get("remedy", "")

    if period == "monthly":
        resp["career"] = ai_data.get("career", "")
        resp["love"]   = ai_data.get("love", "")
        resp["health"] = ai_data.get("health", "")

    return resp


# ── Main route ────────────────────────────────────────────────────────────────

@horoscope_bp.route("/", methods=["GET"])
@jwt_required()
def get_horoscope():
    user_id = get_current_user_id()
    rashi   = request.args.get("rashi",  "मेष").strip()
    period  = request.args.get("period", "daily").strip()

    if rashi not in RASHI_URL_MAP:
        return jsonify({"error": f"'{rashi}' राशि फेला परेन।"}), 404

    info    = RASHI_INFO[rashi]
    today   = datetime.now()
    bs_year = str(today.year + 57)
    bs_date = f"वि.सं. {bs_year}"

    premium_info = get_premium_status(user_id)
    is_premium   = premium_info.get("premium", False)

    cache_key = make_cache_key(user_id, rashi, period, is_premium)
    ttl       = CACHE_TTL_YEARLY if period == "yearly" else CACHE_TTL

    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if time.time() - cached_time < ttl:
            return jsonify({"horoscope": cached_data}), 200

    kundali_summary = ""
    gochar_summary  = ""
    if is_premium:
        kundali_summary = build_kundali_summary(user_id)
        gochar_summary  = build_gochar_summary(user_id)

    prompt, max_tokens = build_prompt(
        rashi, info["english"], period, bs_year,
        kundali_summary, gochar_summary
    )

    try:
        raw     = call_groq(prompt, max_tokens)
        ai_data = parse_json(raw)
    except Exception as e:
        return jsonify({"error": f"राशिफल generate गर्न सकिएन: {str(e)}"}), 503

    if "error" in ai_data and not ai_data.get("prediction"):
        return jsonify({"error": "राशिफल generate गर्न सकिएन।"}), 503

    horoscope = build_response(rashi, period, ai_data, bs_year, bs_date, is_premium)
    _cache[cache_key] = (time.time(), horoscope)

    return jsonify({"horoscope": horoscope}), 200


@horoscope_bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_horoscope():
    today   = datetime.now()
    bs_year = str(today.year + 57)
    bs_date = f"वि.सं. {bs_year}"
    result  = {}

    for rashi, info in RASHI_INFO.items():
        cache_key = make_cache_key(0, rashi, "daily", False)
        if cache_key in _cache:
            cached_time, cached_data = _cache[cache_key]
            if time.time() - cached_time < CACHE_TTL:
                result[rashi] = cached_data
                continue

        try:
            prompt, max_tokens = build_prompt(rashi, info["english"], "daily", bs_year)
            raw       = call_groq(prompt, max_tokens)
            ai_data   = parse_json(raw)
            horoscope = build_response(rashi, "daily", ai_data, bs_year, bs_date, False)
            _cache[cache_key] = (time.time(), horoscope)
            result[rashi] = horoscope
            time.sleep(2)  # rate limit avoid
        except Exception:
            result[rashi] = {"rashi": rashi, "prediction": "", "error": "fetch failed"}

    return jsonify({
        "date":       today.strftime("%Y-%m-%d"),
        "horoscopes": result,
    }), 200
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
import urllib.request
import urllib.error
import re
from datetime import datetime
from functools import lru_cache
import time

horoscope_bp = Blueprint("horoscope", __name__)

# ── Rashi URL mapping ─────────────────────────────────────────────────────────
RASHI_URL_MAP = {
    "मेष":      "Mesh",
    "वृष":      "Brish",
    "मिथुन":   "Mithun",
    "कर्कट":   "Karkat",
    "सिंह":    "Singha",
    "कन्या":   "Kanya",
    "तुला":    "Tula",
    "वृश्चिक": "Brischik",
    "धनु":     "Dhanu",
    "मकर":     "Makar",
    "कुम्भ":   "Kumbha",
    "मीन":     "Meen",
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

# Cache: {(rashi_slug, period, date_str): (text, lucky_color, lucky_number, timestamp)}
_cache: dict = {}
CACHE_TTL = 3600  # 1 hour


def _parse_yearly(html: str, url: str) -> dict:
    """Parse yearly rashifal — extracts rich data including monthly breakdown."""

    def clean(s: str) -> str:
        s = re.sub(r'<[^>]+>', '', s)
        s = re.sub(r'\s+', ' ', s).strip()
        return s

    # ── Main yearly summary (first big paragraph) ─────────────────────────────
    text = ""
    blocks = re.findall(
        r'\n\n([^\n<]{80,}(?:छ|छन्|हुनेछ|रहनेछ|पर्नेछ)[^\n<]{0,500})\n',
        html
    )
    skip = ["hamropatro", "Calendar", "Rashifal", "Features", "Login", "वैशाख २०"]
    for b in blocks:
        if not any(s in b for s in skip) and len(b) > 80:
            text = clean(b)
            break

    # ── Monthly breakdown ────────────────────────────────────────────────────
    bs_months = ["वैशाख","जेठ","असार","साउन","भदौ","असोज","कार्तिक","मङ्सिर","पुस","माघ","फागुन","चैत"]
    monthly_breakdown = {}
    for month in bs_months:
        pattern = rf'{month}\s*[:：]\s*([^\n]+)'
        m = re.search(pattern, html)
        if m:
            monthly_breakdown[month] = clean(m.group(1))

    # ── Section extracts ─────────────────────────────────────────────────────
    def extract_section(heading: str) -> str:
        pattern = rf'{heading}\s*\n+([^\n]{{30,}}(?:\n[^\n]{{10,}})*?)(?=\n\n[^\n]{{0,30}}\n|\Z)'
        m = re.search(pattern, html, re.DOTALL)
        if m:
            return clean(m.group(1))
        return ""

    career  = extract_section("कार्यक्षेत्र")
    love    = extract_section("प्रेम सम्बन्ध")
    health  = extract_section("स्वास्थ्य")
    education = extract_section("शिक्षा")
    remedy  = extract_section("उपाय")

    # ── Lucky info ────────────────────────────────────────────────────────────
    lucky_color  = ""
    lucky_number = ""
    lucky_day    = ""
    lucky_month  = ""

    cm = re.search(r'शुभ रंग\s*\n([^\n]+)', html)
    if cm: lucky_color = clean(cm.group(1))

    nm = re.search(r'शुभ अंक\s*\n([^\n]+)', html)
    if nm: lucky_number = clean(nm.group(1))

    dm = re.search(r'शुभ बार\s*\n([^\n]+)', html)
    if dm: lucky_day = clean(dm.group(1))

    mm = re.search(r'शुभ महिना\s*\n([^\n]+)', html)
    if mm: lucky_month = clean(mm.group(1))

    # ── BS year from heading ──────────────────────────────────────────────────
    year_m = re.search(r'विक्रम संवत्[् ]+(\d+)', html)
    bs_year = year_m.group(1) if year_m else str(datetime.now().year + 57)

    result = {
        "text":              text,
        "monthly_breakdown": monthly_breakdown,
        "career":            career,
        "love":              love,
        "health":            health,
        "education":         education,
        "remedy":            remedy,
        "lucky_color":       lucky_color,
        "lucky_number":      lucky_number,
        "lucky_day":         lucky_day,
        "lucky_month":       lucky_month,
        "bs_year":           bs_year,
        "bs_date":           f"वि.सं. {bs_year}",
    }
    return result


def fetch_hamropatro(slug: str, period: str = "daily") -> dict:
    """Fetch and parse rashifal from HamroPatro."""
    today_str = datetime.now().strftime("%Y-%m-%d")
    # Yearly cache TTL = 24 hours (changes less often)
    cache_key = (slug, period, today_str if period != "yearly" else datetime.now().strftime("%Y-%m"))

    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        ttl = 86400 if period == "yearly" else CACHE_TTL
        if time.time() - cached_time < ttl:
            return cached_data

    # Build URL
    if period == "yearly":
        url = f"https://www.hamropatro.com/rashifal/yearly/{slug}"
    elif period == "weekly":
        url = f"https://www.hamropatro.com/rashifal/weekly/{slug}"
    elif period == "monthly":
        url = f"https://www.hamropatro.com/rashifal/monthly/{slug}"
    else:
        url = f"https://www.hamropatro.com/rashifal/daily/{slug}"

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "ne,en;q=0.9",
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8")
    except Exception as e:
        return {"error": str(e), "text": "", "lucky_color": "", "lucky_number": ""}

    # ── YEARLY: special rich parsing ─────────────────────────────────────────
    if period == "yearly":
        return _parse_yearly(html, url)

    # ── Extract main prediction text ──────────────────────────────────────────
    text = ""

    patterns = [
        r'<h2[^>]*>.*?(?:मेष|वृष|मिथुन|कर्कट|सिंह|कन्या|तुला|वृश्चिक|धनु|मकर|कुम्भ|मीन).*?</h2>\s*\n\n([^\n<]{50,})',
        r'\n\n([^\n<]{80,}(?:छ|छन्|हुनेछ|हुन्छ|मिल्नेछ|रहनेछ|पर्नेछ)[^\n<]{0,200})\n',
    ]

    for pat in patterns:
        match = re.search(pat, html, re.DOTALL)
        if match:
            text = match.group(1).strip()
            text = re.sub(r'<[^>]+>', '', text).strip()
            if len(text) > 50:
                break

    if not text:
        np_blocks = re.findall(
            r'(?<=>|\n)([^\n<]{60,}(?:छ|छन्|हुनेछ|हुन्छ|मिल्नेछ|रहनेछ)[^\n<]{0,300})(?=\n|<)',
            html
        )
        skip = ["hamropatro", "Calendar", "Rashifal", "Features", "News", "वैशाख", "जेठ", "Login"]
        for block in np_blocks:
            if not any(s in block for s in skip) and len(block) > 60:
                text = block.strip()
                text = re.sub(r'<[^>]+>', '', text).strip()
                break

    # ── Extract lucky color ───────────────────────────────────────────────────
    lucky_color = ""
    lucky_number = ""
    color_match = re.search(r'शुभ रंग\s+([^\s]+)\s+हो', html)
    if color_match:
        lucky_color = color_match.group(1).strip()

    num_match = re.search(r'शुभ अंक\s+([^\s]+)\s+रहेको', html)
    if num_match:
        lucky_number = num_match.group(1).strip()

    # Also look in plain text version
    if not lucky_color:
        color_match2 = re.search(r'शुभ रंग ([^\s।]+)', text)
        if color_match2:
            lucky_color = color_match2.group(1)
    if not lucky_number:
        num_match2 = re.search(r'शुभ अंक ([^\s।]+)', text)
        if num_match2:
            lucky_number = num_match2.group(1)

    # ── Extract BS date from page ─────────────────────────────────────────────
    bs_date = ""
    date_match = re.search(r'([\d]+\s+[^\s]+\s+\d{4}\s+[^\s]+)\s+(?:को|मा)\s+राशिफल', html)
    if date_match:
        bs_date = date_match.group(1).strip()

    result = {
        "text":         text,
        "lucky_color":  lucky_color,
        "lucky_number": lucky_number,
        "bs_date":      bs_date,
        "source_url":   url,
    }

    _cache[cache_key] = (time.time(), result)
    return result


def fetch_all_rashifal() -> dict:
    """Fetch all 12 rashis at once from main page (more efficient)."""
    today_str = datetime.now().strftime("%Y-%m-%d")
    cache_key = ("all", "daily", today_str)

    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if time.time() - cached_time < CACHE_TTL:
            return cached_data

    try:
        req = urllib.request.Request(
            "https://www.hamropatro.com/rashifal",
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "ne,en;q=0.9",
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8")
    except Exception as e:
        return {"error": str(e)}

    # Extract per-rashi text from main page
    # Pattern: link contains rashi slug, followed by Nepali text in same block
    result = {}

    slug_to_rashi = {v: k for k, v in RASHI_URL_MAP.items()}

    # Find all rashi blocks: href="/rashifal/daily/Slug" ... text ... lucky info
    rashi_blocks = re.findall(
        r'href="/rashifal/daily/(\w+)"[^>]*>\s*###?\s*[^\n]*\n\n(.*?)(?=\[###|$)',
        html, re.DOTALL
    )

    for slug, block in rashi_blocks:
        rashi_name = slug_to_rashi.get(slug)
        if not rashi_name:
            continue
        # Clean block
        clean = re.sub(r'!\[.*?\]\(.*?\)', '', block)
        clean = re.sub(r'\[.*?\]\(.*?\)', '', clean)
        clean = re.sub(r'<[^>]+>', '', clean).strip()
        # Remove lines that are just nav items
        lines = [l.strip() for l in clean.split('\n') if len(l.strip()) > 40]
        text = ' '.join(lines[:3]) if lines else ""

        # Extract lucky info from block
        color_m  = re.search(r'शुभ रंग\s+(\S+)\s+हो', block)
        number_m = re.search(r'शुभ अंक\s+(\S+)\s+रहेको', block)

        result[rashi_name] = {
            "text":         text,
            "lucky_color":  color_m.group(1)  if color_m  else "",
            "lucky_number": number_m.group(1) if number_m else "",
        }

    _cache[cache_key] = (time.time(), result)
    return result


# ── API Routes ────────────────────────────────────────────────────────────────

@horoscope_bp.route("/", methods=["GET"])
@jwt_required()
def get_horoscope():
    rashi  = request.args.get("rashi", "मेष").strip()
    period = request.args.get("period", "daily").strip()

    if rashi not in RASHI_URL_MAP:
        return jsonify({"error": f"'{rashi}' राशि फेला परेन।"}), 404

    slug = RASHI_URL_MAP[rashi]
    info = RASHI_INFO[rashi]

    data = fetch_hamropatro(slug, period)

    if data.get("error") and not data.get("text"):
        return jsonify({"error": f"HamroPatro बाट data fetch गर्न सकिएन: {data['error']}"}), 503

    today = datetime.now()

    # ── Yearly response — richer data ──────────────────────────────────────────
    if period == "yearly":
        return jsonify({
            "horoscope": {
                "rashi":              rashi,
                "english":            info["english"],
                "symbol":             info["symbol"],
                "element":            info["element"],
                "color":              info["color"],
                "period":             "yearly",
                "date": {
                    "ad":  today.strftime("%Y-%m-%d"),
                    "day": today.strftime("%A"),
                    "bs":  data.get("bs_date", ""),
                },
                "prediction":         data.get("text", ""),
                "monthly_breakdown":  data.get("monthly_breakdown", {}),
                "career":             data.get("career", ""),
                "love":               data.get("love", ""),
                "health":             data.get("health", ""),
                "education":          data.get("education", ""),
                "remedy":             data.get("remedy", ""),
                "lucky": {
                    "color":  data.get("lucky_color", ""),
                    "number": data.get("lucky_number", ""),
                    "day":    data.get("lucky_day", ""),
                    "month":  data.get("lucky_month", ""),
                },
            }
        }), 200

    # ── Daily / Weekly / Monthly response ────────────────────────────────────
    return jsonify({
        "horoscope": {
            "rashi":          rashi,
            "english":        info["english"],
            "symbol":         info["symbol"],
            "element":        info["element"],
            "color":          info["color"],
            "period":         period,
            "date": {
                "ad":  today.strftime("%Y-%m-%d"),
                "day": today.strftime("%A"),
                "bs":  data.get("bs_date", ""),
            },
            "prediction":     data["text"],
            "lucky": {
                "color":  data["lucky_color"],
                "number": data["lucky_number"],
            },
        }
    }), 200


@horoscope_bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_horoscope():
    """Get all 12 rashifal at once."""
    all_data = fetch_all_rashifal()

    if "error" in all_data:
        return jsonify({"error": f"HamroPatro बाट data fetch गर्न सकिएन: {all_data['error']}"}), 503

    today = datetime.now()
    result = {}

    for rashi, data in all_data.items():
        info = RASHI_INFO.get(rashi, {})
        result[rashi] = {
            "rashi":      rashi,
            "english":    info.get("english", ""),
            "symbol":     info.get("symbol", ""),
            "color":      info.get("color", ""),
            "prediction": data["text"],
            "lucky": {
                "color":  data["lucky_color"],
                "number": data["lucky_number"],
            },
        }

    return jsonify({
        "date": today.strftime("%Y-%m-%d"),
        "horoscopes": result,
    }), 200
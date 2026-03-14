from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.models.birth_detail import BirthDetail
from app.models.gochar import GocharRecord
from app.utils.token import get_current_user_id
import ephem
import math
from datetime import datetime, timedelta

gochar_bp = Blueprint("gochar", __name__)


SIGNS_NP = [
    "मेष", "वृष", "मिथुन", "कर्कट", "सिंह", "कन्या",
    "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन"
]

PLANET_NP_MAP = {
    "Sun":     "सूर्य",
    "Moon":    "चन्द्र",
    "Mars":    "मङ्गल",
    "Mercury": "बुध",
    "Jupiter": "बृहस्पति",
    "Venus":   "शुक्र",
    "Saturn":  "शनि",
    "Rahu":    "राहु",
    "Ketu":    "केतु",
}

NEPAL_UTC_OFFSET = timedelta(hours=5, minutes=45)

# Gochar cache TTL — recalculate if older than 30 minutes
GOCHAR_CACHE_MINUTES = 30


def get_lahiri_ayanamsa(jd: float) -> float:
    T = (jd - 2451545.0) / 36525.0
    return (23.8536 + T * 1.396041667) % 360


def tropical_to_sidereal(tropical_lon: float, jd: float) -> float:
    return (tropical_lon - get_lahiri_ayanamsa(jd)) % 360


def get_sign_index(lon: float) -> int:
    return int(lon / 30) % 12


def get_degree_in_sign(lon: float) -> float:
    return lon % 30


def format_degree(deg: float) -> str:
    d = int(deg)
    m = int((deg - d) * 60)
    s = int(((deg - d) * 60 - m) * 60)
    return f"{d}° {m:02d}' {s:02d}\""


def to_utc(local_dt: datetime) -> datetime:
    return local_dt - NEPAL_UTC_OFFSET


def get_jd(utc_dt: datetime) -> float:
    ephem_date = ephem.Date(utc_dt.strftime("%Y/%m/%d %H:%M:%S"))
    return float(ephem_date) + 2415020.0


def compute_lagna(utc_dt: datetime, lat: float, lng: float, jd: float) -> float:
    obs          = ephem.Observer()
    obs.lat      = str(lat)
    obs.lon      = str(lng)
    obs.date     = utc_dt.strftime("%Y/%m/%d %H:%M:%S")
    obs.pressure = 0
    obs.epoch    = ephem.J2000

    ramc_deg = math.degrees(float(obs.sidereal_time())) % 360
    T        = (jd - 2451545.0) / 36525.0
    eps      = 23.4392911 - 0.0130042 * T

    lat_rad  = math.radians(lat)
    eps_rad  = math.radians(eps)
    ramc_rad = math.radians(ramc_deg)

    num = -math.cos(ramc_rad)
    den = math.sin(eps_rad) * math.tan(lat_rad) + math.cos(eps_rad) * math.sin(ramc_rad)
    asc_tropical = math.degrees(math.atan2(num, den)) % 360

    mc_tropical = math.degrees(math.atan2(
        math.sin(ramc_rad),
        math.cos(ramc_rad) * math.cos(eps_rad)
    )) % 360

    diff = (asc_tropical - mc_tropical) % 360
    if 90 <= diff <= 270:
        asc_tropical = (asc_tropical + 180) % 360

    return tropical_to_sidereal(asc_tropical, jd)


def get_current_planet_positions():
    """Get current planetary positions (now in UTC)."""
    now_utc = datetime.utcnow()
    obs = ephem.Observer()
    obs.lat      = "27.7172"   # Kathmandu default
    obs.lon      = "85.3240"
    obs.date     = now_utc.strftime("%Y/%m/%d %H:%M:%S")
    obs.pressure = 0
    obs.epoch    = ephem.J2000

    ephem_date = ephem.Date(now_utc.strftime("%Y/%m/%d %H:%M:%S"))
    jd = float(ephem_date) + 2415020.0

    body_map = {
        "Sun":     ephem.Sun(obs),
        "Moon":    ephem.Moon(obs),
        "Mars":    ephem.Mars(obs),
        "Mercury": ephem.Mercury(obs),
        "Jupiter": ephem.Jupiter(obs),
        "Venus":   ephem.Venus(obs),
        "Saturn":  ephem.Saturn(obs),
    }

    result = {}
    for name, body in body_map.items():
        ecl  = ephem.Ecliptic(body, epoch=ephem.J2000)
        trop = math.degrees(ecl.lon) % 360
        result[name] = tropical_to_sidereal(trop, jd)

    j2000_ephem      = ephem.Date("2000/1/1 12:00:00")
    days_since_j2000 = float(ephem_date) - float(j2000_ephem)
    rahu_trop        = (125.04452 - 0.05295376 * days_since_j2000) % 360
    result["Rahu"]   = tropical_to_sidereal(rahu_trop, jd)
    result["Ketu"]   = (result["Rahu"] + 180) % 360

    return result, jd


def get_transit_effect(planet: str, gochar_house: int) -> dict:
    """
    Basic transit effect based on planet and house from natal Lagna.
    Returns effect type and description.
    """
    effects = {
        "Sun": {
            1:  ("सकारात्मक",   "आत्मविश्वास र ऊर्जामा वृद्धि हुन्छ।"),
            2:  ("सकारात्मक",   "आर्थिक लाभ हुन सक्छ।"),
            3:  ("सकारात्मक",   "सञ्चार र यात्राका लागि शुभ।"),
            4:  ("चुनौतीपूर्ण", "घरेलु विषयमा ध्यान दिनु आवश्यक।"),
            5:  ("सकारात्मक",   "सृजनात्मक र रोमान्टिक समय।"),
            6:  ("सकारात्मक",   "शत्रुमाथि विजय सम्भव।"),
            7:  ("तटस्थ",       "सम्बन्धमा ध्यान दिनु आवश्यक।"),
            8:  ("चुनौतीपूर्ण", "स्वास्थ्य र बाधाहरू सम्भव।"),
            9:  ("सकारात्मक",   "आध्यात्मिक र भाग्यशाली समय।"),
            10: ("सकारात्मक",   "करियरमा सफलता र पहिचान।"),
            11: ("सकारात्मक",   "लाभ र इच्छा पूर्ति।"),
            12: ("चुनौतीपूर्ण", "खर्च र एकान्त सम्भव।"),
        },
        "Moon": {
            1:  ("सकारात्मक",   "भावनात्मक शान्ति र स्वस्थता।"),
            2:  ("सकारात्मक",   "पारिवारिक सामञ्जस्य।"),
            3:  ("सकारात्मक",   "छोटो यात्राका लागि शुभ।"),
            4:  ("सकारात्मक",   "घरेलु सुख।"),
            5:  ("सकारात्मक",   "आनन्द र सृजनशीलता।"),
            6:  ("चुनौतीपूर्ण", "स्वास्थ्यमा सावधानी आवश्यक।"),
            7:  ("सकारात्मक",   "सम्बन्धमा मेलमिलाप।"),
            8:  ("चुनौतीपूर्ण", "भावनात्मक तनाव सम्भव।"),
            9:  ("सकारात्मक",   "आध्यात्मिक विकास।"),
            10: ("सकारात्मक",   "करियरमा पहिचान।"),
            11: ("सकारात्मक",   "सामाजिक लाभ।"),
            12: ("तटस्थ",       "विश्राम र आत्मचिन्तन।"),
        },
        "Mars": {
            1:  ("चुनौतीपूर्ण", "अत्यधिक ऊर्जा — धैर्य राख्नुस्।"),
            2:  ("चुनौतीपूर्ण", "आर्थिक विषयमा सावधानी।"),
            3:  ("सकारात्मक",   "साहस र पराक्रम बढ्छ।"),
            4:  ("चुनौतीपूर्ण", "घरेलु तनाव सम्भव।"),
            5:  ("तटस्थ",       "मिश्रित ऊर्जा र उत्साह।"),
            6:  ("सकारात्मक",   "शत्रु र रोग माथि विजय।"),
            7:  ("चुनौतीपूर्ण", "सम्बन्धमा विवाद सम्भव।"),
            8:  ("चुनौतीपूर्ण", "दुर्घटनाबाट सावधान।"),
            9:  ("तटस्थ",       "मिश्रित भाग्य।"),
            10: ("सकारात्मक",   "कार्यस्थलमा ऊर्जा।"),
            11: ("सकारात्मक",   "मित्र र लाभ।"),
            12: ("चुनौतीपूर्ण", "लुकेका शत्रुबाट सावधान।"),
        },
        "Mercury": {
            1:  ("सकारात्मक",   "बुद्धि र वाकपटुता बढ्छ।"),
            2:  ("सकारात्मक",   "व्यापार र वाणिज्यका लागि शुभ।"),
            3:  ("सकारात्मक",   "सञ्चार र लेखनका लागि उत्तम।"),
            4:  ("तटस्थ",       "पारिवारिक छलफल सम्भव।"),
            5:  ("सकारात्मक",   "शिक्षा र सृजनशीलतामा वृद्धि।"),
            6:  ("तटस्थ",       "कार्यस्थलमा विवाद सम्भव।"),
            7:  ("सकारात्मक",   "साझेदारीका लागि शुभ।"),
            8:  ("तटस्थ",       "गोप्य विषयमा ध्यान।"),
            9:  ("सकारात्मक",   "उच्च शिक्षा र यात्राका लागि शुभ।"),
            10: ("सकारात्मक",   "करियरमा बुद्धिमानी निर्णय।"),
            11: ("सकारात्मक",   "मित्र र नेटवर्क विस्तार।"),
            12: ("तटस्थ",       "एकान्तमा अध्ययन राम्रो।"),
        },
        "Jupiter": {
            1:  ("सकारात्मक",   "ज्ञान र समग्र समृद्धि।"),
            2:  ("सकारात्मक",   "आर्थिक वृद्धि।"),
            3:  ("तटस्थ",       "भाइबहिनीका लागि मिश्रित।"),
            4:  ("सकारात्मक",   "घरेलु सुख।"),
            5:  ("सकारात्मक",   "सन्तान र शिक्षाका लागि आशीर्वाद।"),
            6:  ("चुनौतीपूर्ण", "स्वास्थ्यमा सतर्कता।"),
            7:  ("सकारात्मक",   "साझेदारीमा आशीर्वाद।"),
            8:  ("तटस्थ",       "आध्यात्मिक गहराई।"),
            9:  ("सकारात्मक",   "उत्कृष्ट भाग्य र सौभाग्य।"),
            10: ("सकारात्मक",   "करियरमा उन्नति।"),
            11: ("सकारात्मक",   "ठूलो लाभ र सफलता।"),
            12: ("तटस्थ",       "आध्यात्मिक साधना।"),
        },
        "Venus": {
            1:  ("सकारात्मक",   "आकर्षण र सौन्दर्यमा वृद्धि।"),
            2:  ("सकारात्मक",   "परिवार र धनका लागि शुभ।"),
            3:  ("सकारात्मक",   "कलात्मक अभिव्यक्तिका लागि शुभ।"),
            4:  ("सकारात्मक",   "घरेलु सुख र आराम।"),
            5:  ("सकारात्मक",   "प्रेम र रोमान्सका लागि उत्तम।"),
            6:  ("तटस्थ",       "स्वास्थ्यमा ध्यान दिनुस्।"),
            7:  ("सकारात्मक",   "विवाह र साझेदारीका लागि शुभ।"),
            8:  ("तटस्थ",       "गोप्य प्रेम सम्भव।"),
            9:  ("सकारात्मक",   "धार्मिक यात्रा र भाग्य।"),
            10: ("सकारात्मक",   "करियरमा यश र सम्मान।"),
            11: ("सकारात्मक",   "मित्र र आर्थिक लाभ।"),
            12: ("तटस्थ",       "एकान्तमा प्रेम सम्भव।"),
        },
        "Saturn": {
            1:  ("चुनौतीपूर्ण", "स्वास्थ्य र आत्मानुशासन आवश्यक।"),
            2:  ("चुनौतीपूर्ण", "आर्थिक सावधानी आवश्यक।"),
            3:  ("सकारात्मक",   "कठोर परिश्रमले फल दिन्छ।"),
            4:  ("चुनौतीपूर्ण", "घरेलु दबाब।"),
            5:  ("चुनौतीपूर्ण", "सन्तानका विषयमा सावधानी।"),
            6:  ("सकारात्मक",   "प्रयासद्वारा बाधा पार गर्न सकिन्छ।"),
            7:  ("चुनौतीपूर्ण", "सम्बन्धमा धैर्य आवश्यक।"),
            8:  ("चुनौतीपूर्ण", "स्वास्थ्यमा ध्यान दिनुस्।"),
            9:  ("तटस्थ",       "अनुशासित आध्यात्मिक साधना।"),
            10: ("सकारात्मक",   "कठोर परिश्रमद्वारा करियर उन्नति।"),
            11: ("सकारात्मक",   "धीमो तर स्थिर लाभ।"),
            12: ("तटस्थ",       "आत्मचिन्तन र एकान्त।"),
        },
        "Rahu": {
            1:  ("चुनौतीपूर्ण", "भ्रम र अस्थिरता सम्भव।"),
            2:  ("तटस्थ",       "अपरम्परागत आर्थिक अवसर।"),
            3:  ("सकारात्मक",   "साहसिक कदमका लागि शुभ।"),
            4:  ("चुनौतीपूर्ण", "घरेलु अशान्ति सम्भव।"),
            5:  ("तटस्थ",       "अपरम्परागत प्रेम अनुभव।"),
            6:  ("सकारात्मक",   "शत्रुमाथि अचानक विजय।"),
            7:  ("चुनौतीपूर्ण", "सम्बन्धमा अनिश्चितता।"),
            8:  ("तटस्थ",       "रहस्यमय अनुभवहरू।"),
            9:  ("चुनौतीपूर्ण", "विश्वासमा भ्रम सम्भव।"),
            10: ("तटस्थ",       "अपरम्परागत करियर अवसर।"),
            11: ("सकारात्मक",   "अचानक लाभ सम्भव।"),
            12: ("तटस्थ",       "विदेश यात्रा वा एकान्त।"),
        },
        "Ketu": {
            1:  ("चुनौतीपूर्ण", "आध्यात्मिक खोज, पहिचानमा भ्रम।"),
            2:  ("चुनौतीपूर्ण", "परिवार र धनमा अलगाव।"),
            3:  ("तटस्थ",       "आध्यात्मिक सञ्चार।"),
            4:  ("चुनौतीपूर्ण", "घरेलु अलगाव सम्भव।"),
            5:  ("तटस्थ",       "आध्यात्मिक सृजनशीलता।"),
            6:  ("सकारात्मक",   "कर्म र रोगबाट मुक्ति।"),
            7:  ("चुनौतीपूर्ण", "सम्बन्धमा अलगाव सम्भव।"),
            8:  ("सकारात्मक",   "आध्यात्मिक परिवर्तन।"),
            9:  ("तटस्थ",       "पूर्व जन्मको ज्ञान।"),
            10: ("चुनौतीपूर्ण", "करियरमा अनिश्चितता।"),
            11: ("तटस्थ",       "भौतिक इच्छाबाट विरक्ति।"),
            12: ("सकारात्मक",   "मोक्ष र आध्यात्मिक मुक्ति।"),
        },
    }

    planet_effects = effects.get(planet, {})
    effect_data    = planet_effects.get(gochar_house, ("तटस्थ", "मिश्रित फल अपेक्षित।"))
    return {"effect": effect_data[0], "description": effect_data[1]}


def _is_cache_fresh(saved: GocharRecord) -> bool:
    """Return True if gochar cache is still fresh (within TTL)."""
    if saved is None:
        return False
    if saved.calculated_at is None:
        return False
    calc = saved.calculated_at
    if hasattr(calc, "tzinfo") and calc.tzinfo is not None:
        calc = calc.replace(tzinfo=None)
    age_minutes = (datetime.utcnow() - calc).total_seconds() / 60
    return age_minutes < GOCHAR_CACHE_MINUTES


def _do_calculate(detail) -> dict:
    """Pure gochar calculation — returns gochar_data dict."""
    birth_time_str = str(detail.birth_time)[:5]
    local_dt       = datetime.strptime(
        f"{detail.birth_date} {birth_time_str}", "%Y-%m-%d %H:%M"
    )
    utc_dt   = to_utc(local_dt)
    lat      = float(detail.latitude)
    lng      = float(detail.longitude)
    birth_jd = get_jd(utc_dt)

    lagna_lon        = compute_lagna(utc_dt, lat, lng, birth_jd)
    natal_lagna_sign = get_sign_index(lagna_lon)

    planet_lons, _ = get_current_planet_positions()

    # Build gochar houses — only "planets_np" key (matches DB schema)
    gochar_houses = []
    for i in range(12):
        sign_idx = (natal_lagna_sign + i) % 12
        gochar_houses.append({
            "house":      i + 1,
            "sign_np":    SIGNS_NP[sign_idx],
            "planets_np": [],
        })

    # Place planets into houses
    transit_details = []
    for planet, lon in planet_lons.items():
        planet_sign  = get_sign_index(lon)
        house_idx    = (planet_sign - natal_lagna_sign) % 12
        gochar_house = house_idx + 1

        # Fixed: only append to planets_np (removed stray "planets" key)
        gochar_houses[house_idx]["planets_np"].append(PLANET_NP_MAP[planet])

        effect_info = get_transit_effect(planet, gochar_house)
        deg_in_sign = get_degree_in_sign(lon)

        transit_details.append({
            "planet_np":    PLANET_NP_MAP[planet],
            "sign_np":      SIGNS_NP[planet_sign],
            "degree":       format_degree(deg_in_sign),
            "gochar_house": gochar_house,
            "effect":       effect_info["effect"],
            "description":  effect_info["description"],
        })

    transit_details.sort(key=lambda x: x["gochar_house"])

    return {
        "natal_lagna": {
            "sign_np": SIGNS_NP[natal_lagna_sign],
        },
        "houses":          gochar_houses,
        "transit_details": transit_details,
        "as_of":           datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
    }


@gochar_bp.route("/", methods=["GET"])
@jwt_required()
def get_gochar():
    user_id = get_current_user_id()
    detail  = BirthDetail.find_by_user(user_id)

    if not detail:
        return jsonify({"error": "जन्म विवरण फेला परेन। कृपया पहिले जन्म विवरण भर्नुहोस्।"}), 404

    # ── Step 1: Check cache (gochar changes every ~30 min is fine) ─────────
    recalculate = request.args.get("recalculate", "false").lower() == "true"
    saved       = GocharRecord.find_by_user(user_id)

    if not recalculate and _is_cache_fresh(saved):
        return jsonify({"gochar": saved.to_gochar_dict()}), 200

    # ── Step 2: Calculate fresh ────────────────────────────────────────────
    try:
        gochar_data = _do_calculate(detail)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # ── Step 3: Save to DB ─────────────────────────────────────────────────
    try:
        GocharRecord.upsert(user_id, gochar_data)
    except Exception as e:
        return jsonify({"gochar": gochar_data, "warning": f"DB save failed: {str(e)}"}), 200

    return jsonify({"gochar": gochar_data}), 200
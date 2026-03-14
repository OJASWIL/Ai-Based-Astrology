from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.models.birth_detail import BirthDetail
from app.models.janma_kundali import JanmaKundaliRecord
from app.utils.token import get_current_user_id
import ephem
import math
from datetime import datetime, timedelta

janmakundali_bp = Blueprint("janmakundali", __name__)

SIGNS_NP = [
    "मेष", "वृष", "मिथुन", "कर्कट", "सिंह", "कन्या",
    "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन"
]

NAKSHATRAS = [
    "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा",
    "पुनर्वसु", "पुष्य", "आश्लेषा", "मघा", "पूर्व फाल्गुनी", "उत्तर फाल्गुनी",
    "हस्त", "चित्रा", "स्वाति", "विशाखा", "अनुराधा", "ज्येष्ठा",
    "मूल", "पूर्वाषाढा", "उत्तराषाढा", "श्रवण", "धनिष्ठा",
    "शतभिषा", "पूर्व भाद्रपद", "उत्तर भाद्रपद", "रेवती"
]

DASHA_PLANETS = ["केतु", "शुक्र", "सूर्य", "चन्द्र", "मङ्गल", "राहु", "बृहस्पति", "शनि", "बुध"]
DASHA_YEARS   = [7, 20, 6, 10, 7, 18, 16, 19, 17]
NAKSHATRA_LORD_INDEX = [0, 1, 2, 3, 4, 5, 6, 7, 8] * 3

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


def to_utc(local_dt: datetime) -> datetime:
    return local_dt - NEPAL_UTC_OFFSET


def get_jd(utc_dt: datetime) -> float:
    ephem_date = ephem.Date(utc_dt.strftime("%Y/%m/%d %H:%M:%S"))
    return float(ephem_date) + 2415020.0


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


def get_nakshatra(moon_lon: float):
    nak_size = 360.0 / 27
    idx      = int(moon_lon / nak_size) % 27
    pada     = int((moon_lon % nak_size) / (nak_size / 4)) + 1
    return NAKSHATRAS[idx], pada, idx


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


def compute_planets(utc_dt: datetime, lat: float, lng: float, jd: float) -> dict:
    obs          = ephem.Observer()
    obs.lat      = str(lat)
    obs.lon      = str(lng)
    obs.date     = utc_dt.strftime("%Y/%m/%d %H:%M:%S")
    obs.pressure = 0
    obs.epoch    = ephem.J2000

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
    days_since_j2000 = (
        float(ephem.Date(utc_dt.strftime("%Y/%m/%d %H:%M:%S"))) - float(j2000_ephem)
    )
    rahu_trop      = (125.04452 - 0.05295376 * days_since_j2000) % 360
    result["Rahu"] = tropical_to_sidereal(rahu_trop, jd)
    result["Ketu"] = (result["Rahu"] + 180) % 360

    return result


def assign_to_houses(lagna_lon: float, planet_lons: dict) -> list:
    lagna_sign = get_sign_index(lagna_lon)

    houses = []
    for i in range(12):
        sign_idx = (lagna_sign + i) % 12
        houses.append({
            "house":      i + 1,
            "sign_np":    SIGNS_NP[sign_idx],
            "planets":    [],
            "planets_np": [],
        })

    for planet, lon in planet_lons.items():
        planet_sign = get_sign_index(lon)
        house_idx   = (planet_sign - lagna_sign) % 12
        houses[house_idx]["planets"].append(PLANET_NP_MAP[planet])
        houses[house_idx]["planets_np"].append(PLANET_NP_MAP[planet])

    return houses


def compute_dasha(moon_lon: float, birth_dt: datetime) -> list:
    _, _, nak_idx = get_nakshatra(moon_lon)
    lord_idx      = NAKSHATRA_LORD_INDEX[nak_idx]

    nak_size  = 360.0 / 27
    progress  = (moon_lon % nak_size) / nak_size
    remaining = DASHA_YEARS[lord_idx] * (1.0 - progress)

    birth_year_frac = birth_dt.year + (birth_dt.timetuple().tm_yday - 1) / 365.25

    start  = birth_year_frac
    end    = start + remaining
    dashas = [{
        "planet":    DASHA_PLANETS[lord_idx],
        "planet_np": DASHA_PLANETS[lord_idx],
        "start":     str(int(start)),
        "end":       str(int(end)),
    }]

    for i in range(1, 9):
        idx   = (lord_idx + i) % 9
        start = end
        end   = start + DASHA_YEARS[idx]
        dashas.append({
            "planet":    DASHA_PLANETS[idx],
            "planet_np": DASHA_PLANETS[idx],
            "start":     str(int(start)),
            "end":       str(int(end)),
        })

    now_year = datetime.utcnow().year
    for d in dashas:
        d["current"] = int(d["start"]) <= now_year < int(d["end"])

    return dashas


def detect_yogas(houses: list, planet_lons: dict) -> list:
    yogas = []

    def house_of(p):
        np_name = PLANET_NP_MAP[p]
        for h in houses:
            if np_name in h["planets"]:
                return h["house"]
        return None

    jup_h  = house_of("Jupiter")
    moon_h = house_of("Moon")
    sun_h  = house_of("Sun")
    mer_h  = house_of("Mercury")
    mar_h  = house_of("Mars")
    ven_h  = house_of("Venus")
    sat_h  = house_of("Saturn")

    if jup_h and moon_h and (jup_h - moon_h) % 12 in (0, 3, 6, 9):
        yogas.append({"name": "गजकेसरी योग",
                      "desc": "चन्द्रबाट केन्द्रमा बृहस्पति — ज्ञान, सम्पत्ति र मान्यता प्राप्त हुन्छ।",
                      "strength": "बलियो"})

    if sun_h and mer_h and sun_h == mer_h:
        yogas.append({"name": "बुधआदित्य योग",
                      "desc": "सूर्य र बुधको संयोग — बुद्धि र सञ्चार क्षमता बढाउँछ।",
                      "strength": "मध्यम"})

    if moon_h and mar_h and moon_h == mar_h:
        yogas.append({"name": "चन्द्र-मङ्गल योग",
                      "desc": "चन्द्र र मङ्गलको संयोग — ऊर्जा, महत्वाकांक्षा र आर्थिक लाभ दिन्छ।",
                      "strength": "मध्यम"})

    if ven_h and moon_h and ven_h == moon_h:
        yogas.append({"name": "शुक्र-चन्द्र योग",
                      "desc": "शुक्र र चन्द्रको संयोग — सौन्दर्य, सृजनशीलता र आकर्षण दिन्छ।",
                      "strength": "मध्यम"})

    if sat_h in (1, 4, 7, 10) and get_sign_index(planet_lons["Saturn"]) in (6, 9, 10):
        yogas.append({"name": "शश योग",
                      "desc": "केन्द्रमा बलियो शनि — अधिकार, अनुशासन र दीर्घायु दिन्छ।",
                      "strength": "बलियो"})

    if jup_h in (1, 4, 7, 10) and get_sign_index(planet_lons["Jupiter"]) in (3, 8, 11):
        yogas.append({"name": "हंस योग",
                      "desc": "केन्द्रमा बलियो बृहस्पति — ज्ञान, अध्यात्म र समृद्धि दिन्छ।",
                      "strength": "बलियो"})

    if mar_h in (1, 4, 7, 10) and get_sign_index(planet_lons["Mars"]) in (0, 7, 9):
        yogas.append({"name": "रुचक योग",
                      "desc": "केन्द्रमा बलियो मङ्गल — साहस, नेतृत्व र शारीरिक बल दिन्छ।",
                      "strength": "बलियो"})

    if ven_h in (1, 4, 7, 10) and get_sign_index(planet_lons["Venus"]) in (1, 6, 11):
        yogas.append({"name": "मालव्य योग",
                      "desc": "केन्द्रमा बलियो शुक्र — विलासिता, सौन्दर्य र भौतिक सुख दिन्छ।",
                      "strength": "बलियो"})

    return yogas


def _birth_details_changed(detail, saved: JanmaKundaliRecord) -> bool:
    """
    Return True if birth details were updated AFTER the kundali was last calculated.
    This ensures every change in birth details triggers a fresh calculation.
    """
    if saved is None:
        return True

    detail_updated = getattr(detail, "updated_at", None)
    kundali_calculated = getattr(saved, "calculated_at", None)

    if detail_updated is None or kundali_calculated is None:
        return True

    # Make both timezone-naive for safe comparison
    if hasattr(detail_updated, "tzinfo") and detail_updated.tzinfo is not None:
        detail_updated = detail_updated.replace(tzinfo=None)
    if hasattr(kundali_calculated, "tzinfo") and kundali_calculated.tzinfo is not None:
        kundali_calculated = kundali_calculated.replace(tzinfo=None)

    return detail_updated > kundali_calculated


def _do_calculate(detail) -> dict:
    """Pure calculation — returns kundali_data dict."""
    birth_time_str = str(detail.birth_time)[:5]
    local_dt = datetime.strptime(
        f"{detail.birth_date} {birth_time_str}", "%Y-%m-%d %H:%M"
    )
    utc_dt = to_utc(local_dt)

    lat = float(detail.latitude)
    lng = float(detail.longitude)
    jd  = get_jd(utc_dt)

    lagna_lon   = compute_lagna(utc_dt, lat, lng, jd)
    planet_lons = compute_planets(utc_dt, lat, lng, jd)
    houses      = assign_to_houses(lagna_lon, planet_lons)
    dashas      = compute_dasha(planet_lons["Moon"], local_dt)
    yogas       = detect_yogas(houses, planet_lons)
    nak, pada, _ = get_nakshatra(planet_lons["Moon"])
    lagna_sign_idx = get_sign_index(lagna_lon)

    planetary_positions = []
    for planet, lon_deg in planet_lons.items():
        sign_idx    = get_sign_index(lon_deg)
        deg_in_sign = get_degree_in_sign(lon_deg)
        planetary_positions.append({
            "planet_np": PLANET_NP_MAP[planet],
            "sign_np":   SIGNS_NP[sign_idx],
            "degree":    format_degree(deg_in_sign),
            "longitude": round(lon_deg, 4),
        })

    return {
        "lagna": {
            "sign_np": SIGNS_NP[lagna_sign_idx],
            "degree":  format_degree(get_degree_in_sign(lagna_lon)),
        },
        "rashi": {
            "sign_np": SIGNS_NP[get_sign_index(planet_lons["Moon"])],
        },
        "nakshatra":           nak,
        "nakshatra_pada":      pada,
        "houses":              houses,
        "planetary_positions": planetary_positions,
        "dasha":               dashas,
        "yogas":               yogas,
    }


@janmakundali_bp.route("/", methods=["GET"])
@jwt_required()
def get_kundali():
    user_id = get_current_user_id()
    detail  = BirthDetail.find_by_user(user_id)

    if not detail:
        return jsonify({"error": "जन्म विवरण फेला परेन। कृपया पहिले जन्म विवरण भर्नुहोस्।"}), 404

    record_uid = getattr(detail, "user_id", None)
    if record_uid is not None and str(record_uid) != str(user_id):
        return jsonify({"error": "तथ्याङ्क स्वामित्व मेल खाएन।"}), 403

    birth_info = {
        "name":        detail.full_name,
        "birth_date":  str(detail.birth_date),
        "birth_time":  str(detail.birth_time)[:5],
        "birth_place": detail.birth_place,
        "latitude":    float(detail.latitude),
        "longitude":   float(detail.longitude),
    }

    # ── Step 1: Check DB cache ─────────────────────────────────────────────
    recalculate = request.args.get("recalculate", "false").lower() == "true"
    saved       = JanmaKundaliRecord.find_by_user(user_id)

    # Use cache ONLY if:
    # 1. recalculate flag is NOT set
    # 2. cached record exists
    # 3. birth details have NOT changed since last calculation
    if not recalculate and saved and not _birth_details_changed(detail, saved):
        return jsonify({"kundali": saved.to_kundali_dict(birth_info)}), 200

    # ── Step 2: Calculate fresh ────────────────────────────────────────────
    try:
        kundali_data = _do_calculate(detail)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # ── Step 3: Save to DB ─────────────────────────────────────────────────
    try:
        JanmaKundaliRecord.upsert(user_id, kundali_data)
    except Exception as e:
        # Don't block response if save fails — still return calculated data
        return jsonify({"kundali": {"birth_info": birth_info, **kundali_data},
                        "warning": f"DB save failed: {str(e)}"}), 200

    return jsonify({"kundali": {"birth_info": birth_info, **kundali_data}}), 200


@janmakundali_bp.route("/debug", methods=["GET"])
@jwt_required()
def debug_kundali():
    user_id = get_current_user_id()
    detail  = BirthDetail.find_by_user(user_id)

    if not detail:
        return jsonify({"error": "जन्म विवरण फेला परेन।", "user_id": user_id}), 404

    record_uid = getattr(detail, "user_id", "N/A")
    saved      = JanmaKundaliRecord.find_by_user(user_id)

    detail_updated    = getattr(detail, "updated_at", None)
    kundali_calc      = getattr(saved, "calculated_at", None) if saved else None
    needs_recalculate = _birth_details_changed(detail, saved)

    return jsonify({
        "debug": {
            "authenticated_user_id":  user_id,
            "record_user_id":         record_uid,
            "full_name":              detail.full_name,
            "birth_date":             str(detail.birth_date),
            "birth_time":             str(detail.birth_time)[:5],
            "birth_place":            detail.birth_place,
            "latitude":               str(detail.latitude),
            "longitude":              str(detail.longitude),
            "ownership_match":        str(record_uid) == str(user_id),
            "kundali_cached":         saved is not None,
            "kundali_calculated_at":  kundali_calc.isoformat() if kundali_calc else None,
            "birth_details_updated_at": detail_updated.isoformat() if detail_updated else None,
            "needs_recalculate":      needs_recalculate,
        }
    }), 200
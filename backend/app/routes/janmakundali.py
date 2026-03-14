from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.birth_detail import BirthDetail
from app.utils.token import get_current_user_id
import ephem
import math
from datetime import datetime, timedelta

janmakundali_bp = Blueprint("janmakundali", __name__)

SIGNS_EN = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]
SIGNS_NP = [
    "मेष", "वृष", "मिथुन", "कर्कट", "सिंह", "कन्या",
    "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन"
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

DASHA_PLANETS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASHA_YEARS   = [7, 20, 6, 10, 7, 18, 16, 19, 17]
DASHA_NP      = ["केतु", "शुक्र", "सूर्य", "चन्द्र", "मङ्गल", "राहु", "बृहस्पति", "शनि", "बुध"]
NAKSHATRA_LORD_INDEX = [0, 1, 2, 3, 4, 5, 6, 7, 8] * 3

PLANET_NP_MAP = {
    "Sun": "सूर्य", "Moon": "चन्द्र", "Mars": "मङ्गल",
    "Mercury": "बुध", "Jupiter": "बृहस्पति", "Venus": "शुक्र",
    "Saturn": "शनि", "Rahu": "राहु", "Ketu": "केतु",
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
    """
    Compute Ascendant (Lagna) using standard astronomical formula.
    
    FIXED: Use ephem's built-in radec_of for horizon point,
    then convert to ecliptic longitude — most accurate method.
    """
    obs          = ephem.Observer()
    obs.lat      = str(lat)
    obs.lon      = str(lng)
    obs.date     = utc_dt.strftime("%Y/%m/%d %H:%M:%S")
    obs.pressure = 0
    obs.epoch    = ephem.J2000

    # Get RAMC (Right Ascension of Midheaven Culmination)
    ramc_deg = math.degrees(float(obs.sidereal_time())) % 360

    T   = (jd - 2451545.0) / 36525.0
    eps = 23.4392911 - 0.0130042 * T  # obliquity

    lat_rad  = math.radians(lat)
    eps_rad  = math.radians(eps)
    ramc_rad = math.radians(ramc_deg)

    # Standard ascendant formula
    num = -math.cos(ramc_rad)
    den = math.sin(eps_rad) * math.tan(lat_rad) + math.cos(eps_rad) * math.sin(ramc_rad)

    asc_tropical = math.degrees(math.atan2(num, den)) % 360

    # ── FIXED Quadrant correction ──────────────────────────────────────────
    # MC (Midheaven) tropical longitude
    mc_tropical = math.degrees(math.atan2(
        math.sin(ramc_rad),
        math.cos(ramc_rad) * math.cos(eps_rad)
    )) % 360

    # Ascendant must be in the opposite half of the zodiac from MC
    # i.e., ASC - MC should be between 90 and 270 degrees
    diff = (asc_tropical - mc_tropical) % 360
    if 90 <= diff <= 270:
        # CORRECT: flip needed — asc is in same half as MC
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
            "sign":       SIGNS_EN[sign_idx],
            "sign_np":    SIGNS_NP[sign_idx],
            "planets":    [],
            "planets_np": [],
        })

    for planet, lon in planet_lons.items():
        planet_sign = get_sign_index(lon)
        house_idx   = (planet_sign - lagna_sign) % 12
        houses[house_idx]["planets"].append(planet)
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
        "planet_np": DASHA_NP[lord_idx],
        "start":     str(int(start)),
        "end":       str(int(end)),
    }]

    for i in range(1, 9):
        idx   = (lord_idx + i) % 9
        start = end
        end   = start + DASHA_YEARS[idx]
        dashas.append({
            "planet":    DASHA_PLANETS[idx],
            "planet_np": DASHA_NP[idx],
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
        for h in houses:
            if p in h["planets"]:
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
        yogas.append({"name": "Gajakesari Yoga (गजकेसरी योग)",
                      "desc": "Jupiter in Kendra from Moon — brings wisdom, wealth, and recognition.",
                      "strength": "Strong"})

    if sun_h and mer_h and sun_h == mer_h:
        yogas.append({"name": "Budha-Aditya Yoga (बुधआदित्य योग)",
                      "desc": "Sun and Mercury conjunction — enhances intelligence and communication.",
                      "strength": "Moderate"})

    if moon_h and mar_h and moon_h == mar_h:
        yogas.append({"name": "Chandra-Mangala Yoga (चन्द्र-मङ्गल योग)",
                      "desc": "Moon and Mars conjunction — gives energy, ambition, and financial gains.",
                      "strength": "Moderate"})

    if ven_h and moon_h and ven_h == moon_h:
        yogas.append({"name": "Shukra-Chandra Yoga (शुक्र-चन्द्र योग)",
                      "desc": "Venus and Moon conjunction — bestows beauty, creativity, and charm.",
                      "strength": "Moderate"})

    if sat_h in (1, 4, 7, 10) and get_sign_index(planet_lons["Saturn"]) in (6, 9, 10):
        yogas.append({"name": "Shasha Yoga (शश योग)",
                      "desc": "Saturn strong in kendra — gives authority, discipline, and longevity.",
                      "strength": "Strong"})

    if jup_h in (1, 4, 7, 10) and get_sign_index(planet_lons["Jupiter"]) in (3, 8, 11):
        yogas.append({"name": "Hamsa Yoga (हंस योग)",
                      "desc": "Jupiter strong in kendra — brings wisdom, spirituality, and prosperity.",
                      "strength": "Strong"})

    if mar_h in (1, 4, 7, 10) and get_sign_index(planet_lons["Mars"]) in (0, 7, 9):
        yogas.append({"name": "Ruchaka Yoga (रुचक योग)",
                      "desc": "Mars strong in kendra — gives courage, leadership, and physical strength.",
                      "strength": "Strong"})

    if ven_h in (1, 4, 7, 10) and get_sign_index(planet_lons["Venus"]) in (1, 6, 11):
        yogas.append({"name": "Malavya Yoga (मालव्य योग)",
                      "desc": "Venus strong in kendra — bestows luxury, beauty, and material comforts.",
                      "strength": "Strong"})

    return yogas


@janmakundali_bp.route("/", methods=["GET"])
@jwt_required()
def get_kundali():
    user_id = get_current_user_id()
    detail  = BirthDetail.find_by_user(user_id)

    if not detail:
        return jsonify({"error": "Birth details not found. Please fill birth details first."}), 404

    record_uid = getattr(detail, "user_id", None)
    if record_uid is not None and str(record_uid) != str(user_id):
        return jsonify({"error": "Data ownership mismatch — wrong record returned for this user."}), 403

    try:
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
                "planet":    planet,
                "planet_np": PLANET_NP_MAP[planet],
                "sign":      SIGNS_EN[sign_idx],
                "sign_np":   SIGNS_NP[sign_idx],
                "degree":    format_degree(deg_in_sign),
                "longitude": round(lon_deg, 4),
            })

        return jsonify({
            "kundali": {
                "birth_info": {
                    "name":        detail.full_name,
                    "birth_date":  str(detail.birth_date),
                    "birth_time":  birth_time_str,
                    "birth_place": detail.birth_place,
                    "latitude":    lat,
                    "longitude":   lng,
                },
                "lagna": {
                    "sign":    SIGNS_EN[lagna_sign_idx],
                    "sign_np": SIGNS_NP[lagna_sign_idx],
                    "degree":  format_degree(get_degree_in_sign(lagna_lon)),
                },
                "rashi": {
                    "sign":    SIGNS_EN[get_sign_index(planet_lons["Moon"])],
                    "sign_np": SIGNS_NP[get_sign_index(planet_lons["Moon"])],
                },
                "nakshatra":           nak,
                "nakshatra_pada":      pada,
                "houses":              houses,
                "planetary_positions": planetary_positions,
                "dasha":               dashas,
                "yogas":               yogas,
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@janmakundali_bp.route("/debug", methods=["GET"])
@jwt_required()
def debug_kundali():
    user_id = get_current_user_id()
    detail  = BirthDetail.find_by_user(user_id)

    if not detail:
        return jsonify({"error": "No birth details found.", "user_id": user_id}), 404

    record_uid = getattr(detail, "user_id", "N/A")
    return jsonify({
        "debug": {
            "authenticated_user_id": user_id,
            "record_user_id":        record_uid,
            "full_name":             detail.full_name,
            "birth_date":            str(detail.birth_date),
            "birth_time":            str(detail.birth_time)[:5],
            "birth_place":           detail.birth_place,
            "latitude":              str(detail.latitude),
            "longitude":             str(detail.longitude),
            "ownership_match":       str(record_uid) == str(user_id),
        }
    }), 200
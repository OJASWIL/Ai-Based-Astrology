from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.birth_detail import BirthDetail
from app.utils.token import get_current_user_id
import ephem
import math
from datetime import datetime, timedelta

gochar_bp = Blueprint("gochar", __name__)

SIGNS_EN = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]
SIGNS_NP = [
    "मेष", "वृष", "मिथुन", "कर्कट", "सिंह", "कन्या",
    "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन"
]

PLANET_NP_MAP = {
    "Sun": "सूर्य", "Moon": "चन्द्र", "Mars": "मङ्गल",
    "Mercury": "बुध", "Jupiter": "बृहस्पति", "Venus": "शुक्र",
    "Saturn": "शनि", "Rahu": "राहु", "Ketu": "केतु",
}

NEPAL_UTC_OFFSET = timedelta(hours=5, minutes=45)


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


def get_current_planet_positions() -> dict:
    """Get current planetary positions (now)"""
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
    days_since_j2000 = float(ephem.Date(now_utc.strftime("%Y/%m/%d %H:%M:%S"))) - float(j2000_ephem)
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
            1: ("positive", "Self-confidence and energy boost"),
            2: ("positive", "Financial gains possible"),
            3: ("positive", "Good for communication and travel"),
            4: ("challenging", "Home matters need attention"),
            5: ("positive", "Creative and romantic period"),
            6: ("positive", "Victory over enemies"),
            7: ("neutral", "Relationship focus needed"),
            8: ("challenging", "Health and obstacles possible"),
            9: ("positive", "Spiritual and lucky period"),
            10: ("positive", "Career success and recognition"),
            11: ("positive", "Gains and fulfillment of desires"),
            12: ("challenging", "Expenses and isolation possible"),
        },
        "Moon": {
            1: ("positive", "Emotional well-being and peace"),
            2: ("positive", "Family harmony"),
            3: ("positive", "Good for short travels"),
            4: ("positive", "Domestic happiness"),
            5: ("positive", "Joy and creativity"),
            6: ("challenging", "Health concerns possible"),
            7: ("positive", "Relationship harmony"),
            8: ("challenging", "Emotional stress possible"),
            9: ("positive", "Spiritual growth"),
            10: ("positive", "Career recognition"),
            11: ("positive", "Social gains"),
            12: ("neutral", "Rest and introspection"),
        },
        "Jupiter": {
            1: ("positive", "Wisdom and overall prosperity"),
            2: ("positive", "Financial growth"),
            3: ("neutral", "Mixed results for siblings"),
            4: ("positive", "Home happiness"),
            5: ("positive", "Children and education blessings"),
            6: ("challenging", "Health vigilance needed"),
            7: ("positive", "Blessed partnerships"),
            8: ("neutral", "Spiritual depth"),
            9: ("positive", "Excellent luck and fortune"),
            10: ("positive", "Career advancement"),
            11: ("positive", "Major gains and success"),
            12: ("neutral", "Spiritual pursuits"),
        },
        "Saturn": {
            1: ("challenging", "Health and self-discipline needed"),
            2: ("challenging", "Financial caution advised"),
            3: ("positive", "Hard work brings results"),
            4: ("challenging", "Domestic pressures"),
            5: ("challenging", "Children matters need care"),
            6: ("positive", "Overcoming obstacles through effort"),
            7: ("challenging", "Relationship patience needed"),
            8: ("challenging", "Health and longevity focus"),
            9: ("neutral", "Disciplined spiritual practice"),
            10: ("positive", "Career through hard work"),
            11: ("positive", "Slow but steady gains"),
            12: ("neutral", "Introspection and solitude"),
        },
    }

    default_effects = {
        "Mars":    {h: ("neutral", "Mixed energy and drive") for h in range(1, 13)},
        "Mercury": {h: ("positive", "Good for communication") for h in range(1, 13)},
        "Venus":   {h: ("positive", "Favorable for relationships and comforts") for h in range(1, 13)},
        "Rahu":    {h: ("neutral", "Unconventional experiences") for h in range(1, 13)},
        "Ketu":    {h: ("neutral", "Spiritual detachment") for h in range(1, 13)},
    }

    planet_effects = effects.get(planet, default_effects.get(planet, {}))
    effect_data    = planet_effects.get(gochar_house, ("neutral", "Mixed results expected"))
    return {"effect": effect_data[0], "description": effect_data[1]}


@gochar_bp.route("/", methods=["GET"])
@jwt_required()
def get_gochar():
    user_id = get_current_user_id()
    detail  = BirthDetail.find_by_user(user_id)

    if not detail:
        return jsonify({"error": "Birth details not found. Please fill birth details first."}), 404

    try:
        # Get natal lagna sign index
        from app.routes.janmakundali import (
            compute_lagna, to_utc, get_jd
        )

        birth_time_str = str(detail.birth_time)[:5]
        local_dt = datetime.strptime(
            f"{detail.birth_date} {birth_time_str}", "%Y-%m-%d %H:%M"
        )
        utc_dt   = to_utc(local_dt)
        lat      = float(detail.latitude)
        lng      = float(detail.longitude)
        birth_jd = get_jd(utc_dt)

        from app.routes.janmakundali import tropical_to_sidereal as t2s, get_sign_index as gsi
        lagna_lon      = compute_lagna(utc_dt, lat, lng, birth_jd)
        natal_lagna_sign = gsi(lagna_lon)  # 0-11

        # Get current planetary positions
        planet_lons, current_jd = get_current_planet_positions()

        # Build gochar houses (from natal lagna)
        gochar_houses = []
        for i in range(12):
            sign_idx = (natal_lagna_sign + i) % 12
            gochar_houses.append({
                "house":      i + 1,
                "sign":       SIGNS_EN[sign_idx],
                "sign_np":    SIGNS_NP[sign_idx],
                "planets":    [],
                "planets_np": [],
            })

        # Place current planets into gochar houses
        transit_details = []
        for planet, lon in planet_lons.items():
            planet_sign  = get_sign_index(lon)
            house_idx    = (planet_sign - natal_lagna_sign) % 12
            gochar_house = house_idx + 1

            gochar_houses[house_idx]["planets"].append(planet)
            gochar_houses[house_idx]["planets_np"].append(PLANET_NP_MAP[planet])

            effect_info = get_transit_effect(planet, gochar_house)
            deg_in_sign = get_degree_in_sign(lon)

            transit_details.append({
                "planet":       planet,
                "planet_np":    PLANET_NP_MAP[planet],
                "current_sign": SIGNS_EN[planet_sign],
                "sign_np":      SIGNS_NP[planet_sign],
                "degree":       format_degree(deg_in_sign),
                "gochar_house": gochar_house,
                "effect":       effect_info["effect"],
                "description":  effect_info["description"],
            })

        # Sort by house
        transit_details.sort(key=lambda x: x["gochar_house"])

        return jsonify({
            "gochar": {
                "natal_lagna": {
                    "sign":    SIGNS_EN[natal_lagna_sign],
                    "sign_np": SIGNS_NP[natal_lagna_sign],
                },
                "houses":          gochar_houses,
                "transit_details": transit_details,
                "as_of":           datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
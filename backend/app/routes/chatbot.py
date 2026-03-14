from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.models.birth_detail import BirthDetail
from app.utils.token import get_current_user_id
import requests
import os
from datetime import datetime

chatbot_bp = Blueprint("chatbot", __name__)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


def get_kundali_context(user_id) -> str:
    try:
        from app.routes.janmakundali import (
            compute_lagna, compute_planets, assign_to_houses,
            compute_dasha, get_nakshatra, to_utc, get_jd,
            get_sign_index, SIGNS_EN, SIGNS_NP, PLANET_NP_MAP,
            format_degree, get_degree_in_sign
        )

        detail = BirthDetail.find_by_user(user_id)
        if not detail:
            return "Birth details chhaina."

        birth_time_str = str(detail.birth_time)[:5]
        local_dt = datetime.strptime(f"{detail.birth_date} {birth_time_str}", "%Y-%m-%d %H:%M")
        utc_dt   = to_utc(local_dt)
        lat      = float(detail.latitude)
        lng      = float(detail.longitude)
        jd       = get_jd(utc_dt)

        lagna_lon   = compute_lagna(utc_dt, lat, lng, jd)
        planet_lons = compute_planets(utc_dt, lat, lng, jd)
        houses      = assign_to_houses(lagna_lon, planet_lons)
        dashas      = compute_dasha(planet_lons["Moon"], local_dt)
        nak, pada, _ = get_nakshatra(planet_lons["Moon"])
        lagna_idx   = get_sign_index(lagna_lon)

        # Current dasha
        current_dasha = next((d for d in dashas if d.get("current")), dashas[0])

        planet_lines = []
        for planet, lon in planet_lons.items():
            sidx = get_sign_index(lon)
            house_num = next((h["house"] for h in houses if planet in h["planets"]), "?")
            planet_lines.append(
                f"  - {planet} ({PLANET_NP_MAP[planet]}): {SIGNS_EN[sidx]} ({SIGNS_NP[sidx]}), House {house_num}, {format_degree(get_degree_in_sign(lon))}"
            )

        house_lines = []
        for h in houses:
            if h["planets"]:
                house_lines.append(f"  - House {h['house']} ({h['sign']}/{h['sign_np']}): {', '.join(h['planets'])}")

        context = f"""
=== USER KUNDALI DATA ===
Name: {detail.full_name}
Birth: {detail.birth_date} at {birth_time_str}
Place: {detail.birth_place} (Lat: {lat}, Lng: {lng})

Lagna (Ascendant): {SIGNS_EN[lagna_idx]} ({SIGNS_NP[lagna_idx]})
Moon Sign (Rashi): {SIGNS_EN[get_sign_index(planet_lons['Moon'])]} ({SIGNS_NP[get_sign_index(planet_lons['Moon'])]})
Nakshatra: {nak}, Pada {pada}
Current Mahadasha: {current_dasha['planet']} ({current_dasha['planet_np']}) — {current_dasha['start']} to {current_dasha['end']}

Planetary Positions:
{chr(10).join(planet_lines)}

Occupied Houses:
{chr(10).join(house_lines) if house_lines else "  - (calculating...)"}
=========================
"""
        return context
    except Exception as e:
        return f"Kundali fetch error: {str(e)}"


@chatbot_bp.route("/", methods=["POST"])
@jwt_required()
def chat():
    user_id = get_current_user_id()
    data    = request.get_json()

    if not data or "messages" not in data:
        return jsonify({"error": "messages field required"}), 400

    messages        = data["messages"]
    kundali_context = get_kundali_context(user_id)
    today           = datetime.utcnow().strftime("%Y-%m-%d")

    system_prompt = f"""Timi Jyotish AI ko expert Vedic astrologer assistant hau.
Aaja ko miti: {today}

{kundali_context}

=== TIMILAI KASARI KAAM GARNU PARXA ===

User ley kunai pani kura sodhyo — chahe jhagada, prem, career, swasthya, paisa, ya kei pani — 
timi SADHAI user ko kundali data heri yo pattern follow gara:

**1. SITUATION ACKNOWLEDGE GARA**
User ley ke vayo tyo briefly acknowledge gara (1-2 line).

**2. GRAHA ANALYSIS GARA**
User ko actual kundali heri — aba ko time ma kun graha ko prabhav ley TESTO VAKO HO tyo bata:
- Current Mahadasha/Antardasha ko prabhav
- Relevant planets ko position (house + sign)
- Kun graha ley tyo situation create garyeko ho specifically

Example: "Timro kundali ma Mars (Mangal) 7th house ma xa (relationships), ani Saturn ko drishti pareko xa — yesle garda aaja sathi sanga tension vako ho."

**3. REMEDY DE**
Tyo specific graha ko lagi practical remedies de:
- Mantra (specific, correct)
- Din (kun bar garne)
- Daan (ke dine)
- Gem/color (optional)
- Behavior advice

**4. ASSURANCE DE**
Positive note ma close gara — kati din ma sudhrinxa, ke garyo bhane thik hunxa.

=== LANGUAGE RULES ===
- User Nepali ma bolyo → Nepali ma jawab de (Devanagari)
- User Romanized Nepali ma bolyo (e.g. "jhagada vayo") → Nepali Devanagari ma jawab de
- User English ma bolyo → English ma jawab de
- Mixed bhayo → Nepali preferred

=== TONE ===
- Warm, caring, like a wise astrologer
- Specific (kundali data USE gara, generic nabol)
- Bold (**text**) use gara important points lai
- Bullet points use gara remedies lai
"""

    if not ANTHROPIC_API_KEY:
        return jsonify({"error": "ANTHROPIC_API_KEY not configured"}), 500

    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-opus-4-5",
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": messages,
            },
            timeout=30,
        )

        if response.status_code != 200:
            return jsonify({"error": f"AI API error: {response.text}"}), 500

        result  = response.json()
        ai_text = result["content"][0]["text"]

        return jsonify({"response": ai_text}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
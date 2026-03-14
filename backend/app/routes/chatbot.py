from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.models.birth_detail import BirthDetail
from app.utils.token import get_current_user_id

import os
import json
import urllib.request
import urllib.error
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()


chatbot_bp = Blueprint("chatbot", __name__)

# OpenAI Config
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_MODEL = "gpt-4o-mini"


# -------------------------------
# Get Kundali Context
# -------------------------------
def get_kundali_context(user_id) -> str:
    try:
        detail = BirthDetail.find_by_user(user_id)
        if not detail:
            return "जन्म विवरण फेला परेन।"

        try:
            from app.models.janma_kundali import JanmaKundaliRecord
            saved = JanmaKundaliRecord.find_by_user(user_id)
        except Exception:
            saved = None

        if not saved:
            return "\n".join([
                "=== USER BIRTH DATA ===",
                f"नाम: {detail.full_name}",
                f"जन्म: {detail.birth_date} बजे {str(detail.birth_time)[:5]}",
                f"स्थान: {detail.birth_place}",
                "(कुण्डली calculate भएको छैन — janma-kundali पेज पहिले खोल्नुहोस्)",
                "======================",
            ])

        dashas = saved.dasha if isinstance(saved.dasha, list) else []
        current_dasha = next((d for d in dashas if d.get("current")), dashas[0] if dashas else {})

        planets = saved.planetary_positions if isinstance(saved.planetary_positions, list) else []
        houses = saved.houses if isinstance(saved.houses, list) else []
        yogas = saved.yogas if isinstance(saved.yogas, list) else []

        planet_lines = []
        for p in planets:
            house_num = next(
                (h["house"] for h in houses if p.get("planet") in h.get("planets", [])),
                "?"
            )
            planet_lines.append(
                f"  - {p.get('planet','?')} (भाव {house_num}): {p.get('sign','?')} — {p.get('degree','?')}"
            )

        house_lines = [
            f"  - भाव {h['house']} ({h.get('sign','?')}): {', '.join(h.get('planets', []))}"
            for h in houses if h.get("planets")
        ]

        yoga_lines = [
            f"  - {y.get('name','?')} ({y.get('strength','?')}): {y.get('desc','?')}"
            for y in yogas
        ]

        return "\n".join([
            "=== USER KUNDALI DATA ===",
            f"नाम: {detail.full_name}",
            f"जन्म: {detail.birth_date} बजे {str(detail.birth_time)[:5]}",
            f"स्थान: {detail.birth_place}",
            "",
            f"लग्न: {saved.lagna_sign}",
            f"राशि: {saved.rashi_sign}",
            f"नक्षत्र: {saved.nakshatra}, पाद {saved.nakshatra_pada}",
            f"हाल महादशा: {current_dasha.get('planet','?')} — {current_dasha.get('start','?')} देखि {current_dasha.get('end','?')} सम्म",
            "",
            "ग्रह स्थिति:",
            *(planet_lines if planet_lines else ["  - उपलब्ध छैन"]),
            "",
            "ग्रह भाव:",
            *(house_lines if house_lines else ["  - खाली"]),
            "",
            "योगहरू:",
            *(yoga_lines if yoga_lines else ["  - कुनै प्रमुख योग छैन"]),
            "=========================",
        ])

    except Exception as e:
        return f"(Kundali context error: {str(e)})"


# -------------------------------
# Message Cleaner
# -------------------------------
def sanitize_messages(messages: list, system_prompt: str) -> list:

    if not isinstance(messages, list):
        return []

    cleaned = [
        {"role": m["role"], "content": str(m.get("content", "")).strip()}
        for m in messages
        if isinstance(m, dict)
        and m.get("role") in ("user", "assistant")
        and str(m.get("content", "")).strip()
    ]

    if not cleaned:
        return []

    while cleaned and cleaned[0]["role"] != "user":
        cleaned.pop(0)

    if not cleaned:
        return []

    result = [cleaned[0]]

    for msg in cleaned[1:]:
        if msg["role"] != result[-1]["role"]:
            result.append(msg)
        else:
            result[-1] = msg

    while result and result[-1]["role"] != "user":
        result.pop()

    return [{"role": "system", "content": system_prompt}] + result


# -------------------------------
# Chat Endpoint
# -------------------------------
@chatbot_bp.route("/", methods=["POST"])
@jwt_required()
def chat():

    user_id = get_current_user_id()
    data = request.get_json(silent=True)

    if not data or not isinstance(data.get("messages"), list):
        return jsonify({"error": "messages field required"}), 400

    if not OPENAI_API_KEY:
        return jsonify({"error": "OPENAI_API_KEY .env मा छैन"}), 500

    kundali_context = get_kundali_context(user_id)

    today = datetime.utcnow().strftime("%Y-%m-%d")

    system_prompt = f"""
You are Jyotish AI — expert Vedic astrologer.

Today's date: {today}

{kundali_context}

When answering:
• Analyze planets and houses
• Consider Mahadasha
• Give remedies
• Respond in Nepali if user writes Nepali
"""

    openai_messages = sanitize_messages(data["messages"], system_prompt)

    if len(openai_messages) <= 1:
        return jsonify({"error": "कम्तिमा एउटा user message चाहिन्छ"}), 400

    try:

        payload = json.dumps({
            "model": OPENAI_MODEL,
            "messages": openai_messages,
            "max_tokens": 800,
            "temperature": 0.7
        }).encode("utf-8")

        req = urllib.request.Request(
            OPENAI_API_URL,
            data=payload,
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as resp:

            result = json.loads(resp.read().decode("utf-8"))

            ai_text = result["choices"][0]["message"]["content"]

        return jsonify({"response": ai_text})

    except urllib.error.HTTPError as e:

        try:
            err_body = json.loads(e.read().decode("utf-8"))
            err_msg = err_body.get("error", {}).get("message", str(e))
        except:
            err_msg = str(e)

        if e.code == 401:
            err_msg = "Invalid API key"
        elif e.code == 429:
            err_msg = "Quota सकियो — OpenAI credits check गर्नुहोस्"
        elif e.code == 404:
            err_msg = "Model not found"

        return jsonify({"error": f"OpenAI error ({e.code}): {err_msg}"}), 500

    except urllib.error.URLError as e:
        return jsonify({"error": f"Network error: {str(e.reason)}"}), 503

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# -------------------------------
# Ping Endpoint
# -------------------------------
@chatbot_bp.route("/ping", methods=["GET"])
@jwt_required()
def ping():

    api_key = OPENAI_API_KEY
    user_id = get_current_user_id()

    ctx = get_kundali_context(user_id)

    return jsonify({
        "provider": "OpenAI",
        "model": OPENAI_MODEL,
        "api_key_set": bool(api_key),
        "api_key_prefix": api_key[:10] + "..." if api_key else "MISSING",
        "kundali_ok": "KUNDALI DATA" in ctx,
        "context_preview": ctx[:300]
    })
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.models.birth_detail import BirthDetail
from app.models.chat_usage import ChatUsage, FREE_LIMIT
from app.utils.token import get_current_user_id

import os
from groq import Groq
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

chatbot_bp   = Blueprint("chatbot", __name__)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()
GROQ_MODEL   = "llama-3.3-70b-versatile"


# ── Full context builder ──────────────────────────────────────────────────────

def get_full_context(user_id: int) -> str:
    lines = []

    # ── 1. Birth Details ──────────────────────────────────────────────────
    try:
        detail = BirthDetail.find_by_user(user_id)
        if not detail:
            return "⚠️ जन्म विवरण फेला परेन। पहिले Birth Details भर्नुहोस्।"

        lines += [
            "╔══════════════════════════════════════╗",
            "║      प्रयोगकर्ताको पूर्ण विवरण        ║",
            "╚══════════════════════════════════════╝",
            "",
            "📋 जन्म विवरण:",
            f"  नाम        : {detail.full_name}",
            f"  लिङ्ग      : {getattr(detail, 'gender', 'N/A')}",
            f"  जन्म मिति  : {detail.birth_date}",
            f"  जन्म समय   : {str(detail.birth_time)[:5]} (नेपाल समय)",
            f"  जन्म स्थान : {detail.birth_place}",
            f"  अक्षांश    : {detail.latitude}",
            f"  देशान्तर   : {detail.longitude}",
        ]
    except Exception as e:
        lines.append(f"⚠️ Birth detail error: {e}")
        detail = None

    # ── 2. Janma Kundali ──────────────────────────────────────────────────
    rashi_np = None

    try:
        from app.models.janma_kundali import JanmaKundaliRecord
        saved = JanmaKundaliRecord.find_by_user(user_id)

        if not saved:
            lines += ["", "⚠️ कुण्डली: अझै calculate भएको छैन।"]
        else:
            dashas        = saved.dasha               if isinstance(saved.dasha,               list) else []
            planets       = saved.planetary_positions if isinstance(saved.planetary_positions, list) else []
            houses        = saved.houses              if isinstance(saved.houses,              list) else []
            yogas         = saved.yogas               if isinstance(saved.yogas,               list) else []
            current_dasha = next((d for d in dashas if d.get("current")), dashas[0] if dashas else {})

            rashi_np = saved.rashi_sign

            lines += [
                "",
                "🔯 जन्म कुण्डली:",
                f"  लग्न       : {saved.lagna_sign}",
                f"  राशि       : {saved.rashi_sign}",
                f"  नक्षत्र    : {saved.nakshatra} (पद {saved.nakshatra_pada})",
                f"  हाल महादशा : {current_dasha.get('planet','?')} "
                f"({current_dasha.get('start','?')}–{current_dasha.get('end','?')})",
                "",
                "  🪐 ग्रह स्थिति:",
            ]

            for p in planets:
                house_num = next(
                    (h["house"] for h in houses
                     if p.get("planet_np") in h.get("planets_np", h.get("planets", []))),
                    "?"
                )
                lines.append(
                    f"    • {p.get('planet_np','?'):10} → {p.get('sign_np','?'):8} "
                    f"(भाव {house_num}) | {p.get('degree','?')}"
                )

            lines.append("")
            lines.append("  🏠 भाव विवरण:")
            for h in houses:
                planets_in = h.get("planets_np", h.get("planets", []))
                if planets_in:
                    lines.append(
                        f"    भाव {h['house']:2} ({h.get('sign_np','?'):8}): "
                        f"{', '.join(planets_in)}"
                    )

            if yogas:
                lines.append("")
                lines.append("  ✨ योगहरू:")
                for y in yogas:
                    lines.append(
                        f"    • {y.get('name','?')} [{y.get('strength','?')}]"
                        f" — {y.get('desc','?')}"
                    )

            lines.append("")
            lines.append("  ⏳ दशा तालिका:")
            for d in dashas[:5]:
                marker = " ◄ हाल" if d.get("current") else ""
                lines.append(
                    f"    • {d.get('planet','?'):12} "
                    f"{d.get('start','?')}–{d.get('end','?')}{marker}"
                )

    except Exception as e:
        lines.append(f"⚠️ Kundali error: {e}")

    # ── 3. Gochar ─────────────────────────────────────────────────────────
    try:
        from app.models.gochar import GocharRecord
        gochar = GocharRecord.find_by_user(user_id)

        if gochar:
            gochar_dict     = gochar.to_gochar_dict()
            transit_details = gochar_dict.get("transit_details", [])
            natal_lagna     = gochar_dict.get("natal_lagna", {})

            lines += [
                "",
                "🌍 हालको गोचर (Current Transits):",
                f"  जन्म लग्न : {natal_lagna.get('sign_np','?')}",
                f"  गणना समय  : {gochar_dict.get('as_of','?')}",
                "",
                "  ग्रह गोचर विवरण:",
            ]

            for t in transit_details:
                effect_emoji = (
                    "✅" if t.get("effect") == "सकारात्मक"
                    else "⚠️" if t.get("effect") == "चुनौतीपूर्ण"
                    else "⚖️"
                )
                lines.append(
                    f"    {effect_emoji} {t.get('planet_np','?'):12} → "
                    f"{t.get('sign_np','?'):8} (गोचर भाव {t.get('gochar_house','?')}) | "
                    f"{t.get('effect','?')}: {t.get('description','?')}"
                )
        else:
            lines += ["", "⚠️ गोचर: अझै calculate भएको छैन।"]

    except Exception as e:
        lines.append(f"⚠️ Gochar error: {e}")

    # ── 4. Daily + Weekly Horoscope ───────────────────────────────────────
    try:
        if rashi_np:
            from app.routes.horoscope import RASHI_URL_MAP, fetch_hamropatro

            slug = RASHI_URL_MAP.get(rashi_np)
            if slug:
                # Daily
                daily      = fetch_hamropatro(slug, "daily")
                prediction = daily.get("text", "")
                lucky_color  = daily.get("lucky_color", "")
                lucky_number = daily.get("lucky_number", "")

                lines += ["", f"📰 आजको राशिफल ({rashi_np} राशि):"]

                if prediction:
                    words, chunk, chunks = prediction.split(), [], []
                    for word in words:
                        chunk.append(word)
                        if len(" ".join(chunk)) > 80:
                            chunks.append("  " + " ".join(chunk))
                            chunk = []
                    if chunk:
                        chunks.append("  " + " ".join(chunk))
                    lines += chunks
                else:
                    lines.append("  (राशिफल उपलब्ध छैन)")

                if lucky_color:
                    lines.append(f"  🎨 शुभ रंग  : {lucky_color}")
                if lucky_number:
                    lines.append(f"  🔢 शुभ अंक  : {lucky_number}")

                # Weekly
                weekly      = fetch_hamropatro(slug, "weekly")
                weekly_text = weekly.get("text", "")
                if weekly_text:
                    lines += [
                        "",
                        f"📅 यो हप्ताको राशिफल ({rashi_np} राशि):",
                        f"  {weekly_text[:300]}{'...' if len(weekly_text) > 300 else ''}",
                    ]
            else:
                lines += ["", f"⚠️ राशिफल: '{rashi_np}' map मा फेला परेन।"]
        else:
            lines += ["", "⚠️ राशिफल: कुण्डली नभएकाले राशि थाहा भएन।"]

    except Exception as e:
        lines.append(f"⚠️ Horoscope fetch error: {e}")

    lines += ["", "══════════════════════════════════════"]
    return "\n".join(lines)


# ── Message sanitizer ─────────────────────────────────────────────────────────

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

    result = result[-10:]
    return [{"role": "system", "content": system_prompt}] + result


# ── Chat endpoint ─────────────────────────────────────────────────────────────

@chatbot_bp.route("/", methods=["POST"])
@jwt_required()
def chat():
    user_id = get_current_user_id()
    data    = request.get_json(silent=True)
    premium = ChatUsage.is_premium(user_id)

    can_chat, used, remaining = ChatUsage.can_chat(user_id)

    if not can_chat:
        return jsonify({
            "error":   "free_limit_reached",
            "message": f"आजको {FREE_LIMIT} वटा नि:शुल्क प्रश्न सकियो! 🌟 Premium लिएर असीमित प्रश्न सोध्नुहोस्!",
            "upgrade": True,
            "used":    used,
            "limit":   FREE_LIMIT,
        }), 403

    if not data or not isinstance(data.get("messages"), list):
        return jsonify({"error": "messages field required"}), 400

    if not GROQ_API_KEY:
        return jsonify({"error": "GROQ_API_KEY .env मा छैन"}), 500

    full_context = get_full_context(user_id)
    today        = datetime.utcnow().strftime("%Y-%m-%d (%A)")

    plan_info = (
        "✅ PREMIUM सदस्य — सबै सुविधाहरू उपलब्ध"
        if premium
        else f"⚡ FREE सदस्य — आज {max(0, remaining - 1)} प्रश्न बाँकी रहनेछन्"
    )

    system_prompt = f"""तपाईं **Jyotish AI** हुनुहुन्छ — नेपालको सर्वश्रेष्ठ AI वैदिक ज्योतिषी।
तपाईंसँग परम्परागत वैदिक ज्योतिष, लाहिरी अयनांश पद्धति, र नेपाली पञ्चाङ्गमा गहन ज्ञान छ।

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 आजको मिति (UTC): {today}
👤 सदस्यता: {plan_info}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{full_context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 तपाईंको मुख्य कार्य:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

माथिको सम्पूर्ण डेटा (जन्म विवरण + कुण्डली + गोचर + आजको राशिफल) एकसाथ
विश्लेषण गरेर प्रश्नको उत्तर दिनुहोस्।

उदाहरण:
- "आज टाउको दुख्यो" → आजको राशिफल + गोचरमा चन्द्र/सूर्य + षष्ठ भाव + महादशा
- "करियर कस्तो छ" → दशम भाव + दशमेश + आजको राशिफल + गोचर
- "विवाह कहिले" → सप्तम भाव + सप्तमेश + शुक्र + दशा
- "आर्थिक अवस्था" → द्वितीय + एकादश भाव + बृहस्पति + राशिफल
- "आज शुभ छ कि छैन" → आजको राशिफल + गोचर एकसाथ हेर्नुहोस्

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 उत्तर दिने नियम:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

भाषा:
- नेपालीमा सोधे → नेपालीमा उत्तर
- English मा सोधे → English मा उत्तर
- मिश्रित → नेपालीलाई प्राथमिकता

विश्लेषण पद्धति:
- सधैं माथिको कुण्डली, गोचर र राशिफल डेटा प्रयोग गर्नुहोस्
- ग्रह, भाव, राशि, दशा, गोचर र आजको राशिफल सबैलाई एकसाथ विचार गर्नुहोस्
- प्रयोगकर्ताको लग्न, राशि र हाल महादशा अनुसार personalized उत्तर दिनुहोस्
- अनुमान नगर्नुहोस् — माथिको डेटामा आधारित मात्र विश्लेषण गर्नुहोस्

उत्तरको ढाँचा:
📊 विश्लेषण — कुन ग्रह/भाव/गोचर/राशिफलले प्रभाव पारेको (२-३ बुँदा)
💡 सुझाव — व्यावहारिक उपाय
🙏 उपाय — मन्त्र, रत्न, दान वा व्रत

सीमाहरू:
- मृत्यु वा दुर्घटनाको सटीक समय नभन्नुहोस्
- स्वास्थ्य गम्भीर भए डाक्टर सुझाव दिनुहोस्
- सधैं सकारात्मक दृष्टिकोण राख्नुहोस्"""

    groq_messages = sanitize_messages(data["messages"], system_prompt)

    if len(groq_messages) <= 1:
        return jsonify({"error": "कम्तिमा एउटा user message चाहिन्छ"}), 400

    try:
        client   = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model       = GROQ_MODEL,
            messages    = groq_messages,
            max_tokens  = 1024,
            temperature = 0.7,
        )
        ai_text   = response.choices[0].message.content
        new_count = ChatUsage.increment(user_id)
        remaining_after = max(0, FREE_LIMIT - new_count) if not premium else -1

        return jsonify({
            "response": ai_text,
            "usage": {
                "used":      new_count,
                "limit":     FREE_LIMIT if not premium else None,
                "remaining": remaining_after if not premium else None,
                "premium":   premium,
            }
        })

    except Exception as e:
        err = str(e)
        if "401" in err or "invalid_api_key" in err.lower():
            return jsonify({"error": "Invalid Groq API key"}), 500
        if "429" in err or "rate_limit" in err.lower():
            return jsonify({"error": "Rate limit — केही सेकेन्ड पछि फेरि प्रयास गर्नुहोस्"}), 429
        return jsonify({"error": f"AI error: {err}"}), 500


# ── Usage status ──────────────────────────────────────────────────────────────

@chatbot_bp.route("/usage", methods=["GET"])
@jwt_required()
def usage_status():
    user_id = get_current_user_id()
    premium = ChatUsage.is_premium(user_id)
    used    = ChatUsage.get_today_count(user_id)
    return jsonify({
        "premium":   premium,
        "used":      used,
        "limit":     FREE_LIMIT if not premium else None,
        "remaining": max(0, FREE_LIMIT - used) if not premium else None,
    })


# ── Ping ──────────────────────────────────────────────────────────────────────

@chatbot_bp.route("/ping", methods=["GET"])
@jwt_required()
def ping():
    user_id = get_current_user_id()
    ctx     = get_full_context(user_id)
    return jsonify({
        "provider":        "Groq",
        "model":           GROQ_MODEL,
        "api_key_set":     bool(GROQ_API_KEY),
        "api_key_prefix":  GROQ_API_KEY[:10] + "..." if GROQ_API_KEY else "MISSING",
        "kundali_ok":      "जन्म कुण्डली" in ctx,
        "gochar_ok":       "हालको गोचर" in ctx,
        "horoscope_ok":    "आजको राशिफल" in ctx,
        "context_lines":   len(ctx.split("\n")),
        "context_preview": ctx[:600],
    })
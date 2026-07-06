from app.services.openaq_service import fetch_live_aqi_details, get_cpcb_category, get_us_aqi_category
from app.services.openmeteo_service import fetch_weather
from app.services.gemini_service import generate_text
from app.services.prompt_utils import compact_prompt, short_system_instruction
import json

async def run(city: str) -> dict:
    """
    Personal Environment Agent: Gathers live AQI and temperature/rainfall,
    and provides explainable outdoor safety suggestions for citizens.
    """
    aqi_details = await fetch_live_aqi_details(city)
    aqi_us = aqi_details.get("aqi_us", 50.0)
    aqi_cpcb = aqi_details.get("aqi_cpcb", aqi_us)
    weather = await fetch_weather(city)
    temp = weather.get("temperature", 25.0)
    rain = weather.get("rainfall", 0.0)

    category = aqi_details.get("category", get_us_aqi_category(aqi_us))
    cpcb_category = get_cpcb_category(aqi_cpcb)
    is_safe = aqi_us <= 100.0

    prompt = f"""
    You are Sarthi's Personal Environment Agent.
    For the city {city}, the current metrics are:
    - Air Quality Index (AQI-US): {aqi_us} ({category})
    - Air Quality Index (CPCB): {aqi_cpcb} ({cpcb_category})
    - Temperature: {temp}°C
    - Rainfall: {rain}mm
    
    Provide personal health/safety recommendations for citizens in {city} (e.g. outdoor activity, mask usage, jogging safety).
    Output your analysis ONLY as a valid JSON object matching this schema (no markdown, no ```json):
    {{
        "is_safe": true or false,
        "why": "Detailed assessment explaining how the AQI-US and CPCB AQI values plus weather metrics affect human health today.",
        "recommendations": [
            "Recommendation 1",
            "Recommendation 2",
            "Recommendation 3"
        ]
    }}
    """
    
    compacted = compact_prompt(prompt)
    system_instruction = short_system_instruction("environment")
    response = generate_text(compacted, system_instruction=system_instruction)
    try:
        text = response.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        data = json.loads(text)
        # Sanity-check model output against numeric AQI; override if contradicts
        try:
            canonical_safe, canonical_why, canonical_recs = _canonical_recommendations(aqi_us, rain)
            model_safe = bool(data.get("is_safe", canonical_safe))
            model_recs = [r.lower() for r in data.get("recommendations", [])]
            # If model says safe but numeric AQI indicates not safe, override
            if canonical_safe is False and model_safe is True:
                data["is_safe"] = canonical_safe
                data["why"] = canonical_why
                data["recommendations"] = canonical_recs
            else:
                # If model recommended 'no masks' but canonical suggests masks, override
                if any("no mask" in r or "no masks" in r for r in model_recs) and any("mask" in r for r in canonical_recs):
                    data["recommendations"] = canonical_recs
                    data["why"] = canonical_why
        except Exception:
            pass
    except Exception as e:
        print(f"Fallback parsing for Personal Env Agent: {e}")
        recs = []
        if aqi_us <= 50:
            why = f"The air quality in {city} is Good (AQI-US {aqi_us}) with minimal health impacts. Safe for all outdoor activities."
            recs = ["Safe to jog or exercise outdoors.", "Ensure indoor ventilation.", "No masks necessary."]
        elif aqi_us <= 100:
            why = f"The air quality in {city} is Moderate (AQI-US {aqi_us}). Sensitive groups should monitor for minor breathing issues."
            recs = ["Safe for general outdoor work.", "Sensitive citizens should take breaks.", "Ventilate during non-peak traffic times."]
        elif aqi_us <= 150:
            why = f"The air quality in {city} is Unhealthy for Sensitive Groups (AQI-US {aqi_us}). Children, elderly, and lung/heart patients may experience discomfort."
            recs = ["Wear regular surgical masks during transit.", "People with asthma should keep inhalers ready.", "Prefer indoor exercise if possible."]
        elif aqi_us <= 200:
            why = f"The air quality in {city} is Unhealthy (AQI-US {aqi_us}). Health advisories warn of breathing issues for general population."
            recs = ["Avoid long hours outdoors.", "Wear an N95 mask when traveling.", "Keep windows shut; use air purifiers."]
        else:
            why = f"The air quality in {city} is {category} (AQI-US {aqi_us}). High risk of respiratory illnesses on exposure."
            recs = ["Avoid all physical activity outdoors.", "Run air purifiers on high speed indoors.", "Ensure elderly stay in clean air rooms."]
            
        if rain > 15.0:
            recs.append(f"Caution: Rainfall ({rain}mm) is moderate to heavy. Avoid waterlogged street corners.")
            
        data = {
            "is_safe": aqi_us <= 100.0,
            "why": why,
            "recommendations": recs
        }
        
    return {
        "city": city,
        "aqi": aqi_us,
        "aqi_us": aqi_us,
        "aqi_cpcb": aqi_cpcb,
        "temperature": temp,
        "rainfall": rain,
        "category": category,
        "is_safe": data.get("is_safe", is_safe),
        "recommendations": data.get("recommendations", []),
        "why": data.get("why", "")
    }


def _canonical_recommendations(aqi_us: float, rain: float) -> (bool, str, list):
    """Return canonical is_safe, why, and recommendations based on numeric AQI and rainfall."""
    if aqi_us <= 50:
        why = f"The air quality is Good (AQI-US {aqi_us}). Minimal health impact."
        recs = ["Safe to jog or exercise outdoors.", "Ensure indoor ventilation.", "No masks necessary."]
        return True, why, recs
    if aqi_us <= 100:
        why = f"The air quality is Moderate (AQI-US {aqi_us}). Some sensitive people may be affected."
        recs = ["Safe for general outdoor work.", "Sensitive citizens should take breaks.", "Ventilate during non-peak traffic times."]
        return True, why, recs
    if aqi_us <= 150:
        why = f"Unhealthy for Sensitive Groups (AQI-US {aqi_us}). Children, elderly, and people with respiratory conditions may be affected."
        recs = ["Limit prolonged outdoor exertion.", "Wear a well-fitting surgical or higher-grade mask during travel.", "People with asthma keep inhalers handy."]
        return False, why, recs
    if aqi_us <= 200:
        why = f"Unhealthy (AQI-US {aqi_us}). General population may experience health effects."
        recs = ["Avoid long hours outdoors.", "Wear an N95/FFP2 mask when outdoors.", "Keep windows closed and use air purifiers indoors."]
        return False, why, recs
    if aqi_us <= 300:
        why = f"Very Unhealthy (AQI-US {aqi_us}). Serious health effects possible."
        recs = ["Avoid all outdoor physical activity.", "Use high-efficiency masks (N95/FFP2) if going outside.", "Ensure vulnerable people stay indoors in clean-air rooms."]
        return False, why, recs
    why = f"Hazardous air quality (AQI-US {aqi_us}). Extreme conditions."
    recs = ["Remain indoors and avoid exposure.", "Use high-efficiency filtration and masks if necessary.", "Seek medical attention for breathing issues."]
    return False, why, recs

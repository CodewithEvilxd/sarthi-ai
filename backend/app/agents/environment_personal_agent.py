from app.services.openaq_service import fetch_live_aqi_details, get_cpcb_category, get_us_aqi_category
from app.services.openmeteo_service import fetch_weather
from app.services.gemini_service import generate_text
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
    
    response = generate_text(prompt)
    try:
        text = response.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        data = json.loads(text)
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

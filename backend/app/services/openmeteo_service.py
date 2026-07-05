from app.services.openaq_service import CITY_COORDINATES
from app.services import cache
from app.services.service_utils import fetch_json, log_event

async def fetch_weather(city: str) -> dict:
    """
    Fetches temperature and rain forecast from Open-Meteo.
    Returns: {"temperature": float, "rainfall": float}
    """
    if city not in CITY_COORDINATES:
        return {"temperature": 25.0, "rainfall": 0.0}
        
    cache_key = f"weather:{city}"
    cached_val = cache.get(cache_key)
    if cached_val is not None:
        return cached_val
    
    coords = CITY_COORDINATES[city]
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "current": "temperature_2m,rain",
        "hourly": "temperature_2m,rain",
        "timezone": "auto",
    }
    result = await _fetch_live_weather(url, params, city)

    if result is None:
        # Realistic mock fallbacks
        fallbacks = {
            "Patna": {"temperature": 32.0, "rainfall": 12.0},
            "Delhi": {"temperature": 38.0, "rainfall": 0.0},
            "Mumbai": {"temperature": 29.0, "rainfall": 25.5},
            "Bengaluru": {"temperature": 24.0, "rainfall": 2.0}
        }
        result = fallbacks.get(city, {"temperature": 25.0, "rainfall": 0.0})
        log_event("weather_fallback_used", city=city, temperature=result["temperature"], rainfall=result["rainfall"])
        
    cache.set(cache_key, result, ttl_seconds=300)
    return result


async def _fetch_live_weather(url: str, params: dict, city: str) -> dict | None:
    data = await fetch_json(url, params=params, timeout_seconds=4.0, retries=3, backoff_seconds=0.4, service_name="openmeteo_weather")
    if not data:
        return None

    current = data.get("current", {}) or {}
    temp = current.get("temperature_2m")
    rain = current.get("rain")
    if isinstance(temp, (int, float)) and isinstance(rain, (int, float)):
        log_event("weather_provider_hit", city=city, provider="current", temperature=temp, rainfall=rain)
        return {"temperature": float(temp), "rainfall": float(rain)}

    hourly = data.get("hourly", {}) or {}
    temps = hourly.get("temperature_2m", []) or []
    rains = hourly.get("rain", []) or []
    if temps:
        temp = temps[0]
        rain = rains[0] if rains else 0.0
        if isinstance(temp, (int, float)):
            log_event("weather_provider_hit", city=city, provider="hourly", temperature=temp, rainfall=rain)
            return {"temperature": float(temp), "rainfall": float(rain or 0.0)}

    return None

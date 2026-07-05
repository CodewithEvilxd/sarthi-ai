import datetime
import math
import random

from app.config import settings
from app.services import cache
from app.services.service_utils import fetch_json, log_event

CITY_COORDINATES = {
    "Patna": {"lat": 25.5941, "lon": 85.1376},
    "Delhi": {"lat": 28.7041, "lon": 77.1025},
    "Mumbai": {"lat": 19.0760, "lon": 72.8777},
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946}
}

async def fetch_live_aqi(city: str) -> float:
    """
    Returns the live AQI-US value for a city.
    The richer payload is available through fetch_live_aqi_details().
    """
    details = await fetch_live_aqi_details(city)
    return float(details["aqi_us"])


async def fetch_live_aqi_details(city: str) -> dict:
    """
    Returns live AQI details for a city, including AQI-US, CPCB AQI and raw PM values.
    """
    if city not in CITY_COORDINATES:
        return {
            "aqi_us": 50.0,
            "aqi_cpcb": 50.0,
            "pm25": None,
            "pm10": None,
            "source": "fallback",
            "category": get_us_aqi_category(50.0),
        }

    cache_key = f"aqi:{city}:details"
    cached_val = cache.get(cache_key)
    if cached_val is not None:
        return cached_val

    result = None

    api_key = settings.openaq_api_key
    if api_key and api_key != "your_openaq_api_key_here":
        result = await _fetch_from_openaq(city, api_key)

    if result is None:
        result = await _fetch_from_openmeteo(city)

    if result is None:
        base_aqis = {
            "Patna": 195.0,
            "Delhi": 310.0,
            "Mumbai": 82.0,
            "Bengaluru": 48.0
        }
        base = base_aqis.get(city, 50.0)
        hour = datetime.datetime.now().hour
        fluctuation = math.sin((hour - 6) * 3.14159 / 12) * 15
        us_value = round(max(10.0, base + fluctuation + random.uniform(-5, 5)), 1)
        result = {
            "aqi_us": us_value,
            "aqi_cpcb": round(max(10.0, us_value), 1),
            "pm25": None,
            "pm10": None,
            "source": "synthetic",
            "category": get_us_aqi_category(us_value),
        }
        log_event("aqi_fallback_used", city=city, aqi_us=us_value)

    cache.set(cache_key, result, ttl_seconds=300)
    return result


async def _fetch_from_openaq(city: str, api_key: str) -> dict | None:
    coords = CITY_COORDINATES[city]
    headers = {"X-API-Key": api_key}
    locations_url = "https://api.openaq.org/v3/locations"
    params = {"coordinates": f"{coords['lat']},{coords['lon']}", "radius": 25000, "limit": 10}

    loc_data = await fetch_json(locations_url, params=params, headers=headers, timeout_seconds=4.0, retries=2, backoff_seconds=0.4, service_name="openaq")
    if not loc_data:
        return None

    loc_results = loc_data.get("results", [])
    if not loc_results:
        return None

    def get_loc_last_date(location: dict) -> datetime.datetime:
        dt_last_obj = location.get("datetimeLast")
        dt_last_str = dt_last_obj.get("utc", "") if isinstance(dt_last_obj, dict) else ""
        if dt_last_str:
            try:
                return datetime.datetime.fromisoformat(dt_last_str.replace("Z", "+00:00"))
            except Exception:
                pass
        return datetime.datetime.min.replace(tzinfo=datetime.timezone.utc)

    loc_results.sort(key=get_loc_last_date, reverse=True)
    now = datetime.datetime.now(datetime.timezone.utc)
    recent_payloads = []
    fallback_payloads = []

    for location in loc_results[:3]:
        location_id = location.get("id")
        if not location_id:
            continue

        sensors = location.get("sensors", [])
        pm25_sensor_ids = [s.get("id") for s in sensors if s.get("parameter", {}).get("name", "").lower() in ["pm25", "pm2.5"]]
        pm10_sensor_ids = [s.get("id") for s in sensors if s.get("parameter", {}).get("name", "").lower() == "pm10"]
        if not pm25_sensor_ids and not pm10_sensor_ids:
            continue

        latest_url = f"https://api.openaq.org/v3/locations/{location_id}/latest"
        latest_data = await fetch_json(latest_url, headers=headers, timeout_seconds=4.0, retries=2, backoff_seconds=0.4, service_name="openaq")
        if not latest_data:
            continue

        for item in latest_data.get("results", []):
            s_id = item.get("sensorsId")
            val = item.get("value", 0.0)
            dt_str = item.get("datetime", {}).get("utc", "")

            is_recent = False
            if dt_str:
                try:
                    dt_meas = datetime.datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
                    if (now - dt_meas).days <= 7:
                        is_recent = True
                except Exception:
                    pass

            pm25 = None
            pm10 = None
            if s_id in pm25_sensor_ids:
                pm25 = float(val)
                aqi_us = calculate_us_aqi_from_pm25(pm25)
                aqi_cpcb = calculate_aqi_from_pm25(pm25)
            elif s_id in pm10_sensor_ids:
                pm10 = float(val)
                aqi_us = calculate_us_aqi_from_pm10(pm10)
                aqi_cpcb = calculate_aqi_from_pm10(pm10)
            else:
                continue

            payload = {
                "aqi_us": round(aqi_us, 1),
                "aqi_cpcb": round(aqi_cpcb, 1),
                "pm25": round(pm25, 1) if pm25 is not None else None,
                "pm10": round(pm10, 1) if pm10 is not None else None,
                "source": "openaq",
                "category": get_us_aqi_category(aqi_us),
            }

            if is_recent:
                recent_payloads.append(payload)
            else:
                fallback_payloads.append(payload)

    if recent_payloads:
        best_payload = select_best_payload(recent_payloads)
        if best_payload is not None:
            log_event("aqi_provider_hit", provider="openaq", city=city, location=location.get("name"), raw_value=val, aqi_us=best_payload["aqi_us"], aqi_cpcb=best_payload["aqi_cpcb"])
            return best_payload

    if fallback_payloads:
        best_payload = select_best_payload(fallback_payloads)
        if best_payload is not None:
            log_event("aqi_provider_hit", provider="openaq_stale", city=city, aqi_us=best_payload["aqi_us"], aqi_cpcb=best_payload["aqi_cpcb"])
            return best_payload

    return None


async def _fetch_from_openmeteo(city: str) -> dict | None:
    coords = CITY_COORDINATES[city]
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "current": "pm10,pm2_5,european_aqi,us_aqi",
        "domains": "auto",
        "timezone": "auto",
    }

    data = await fetch_json(url, params=params, timeout_seconds=5.0, retries=3, backoff_seconds=0.5, service_name="openmeteo_air_quality")
    if not data:
        return None

    current = data.get("current", {}) or {}
    pm25 = current.get("pm2_5")
    pm10 = current.get("pm10")
    candidates = []
    if isinstance(pm25, (int, float)):
        candidates.append((calculate_us_aqi_from_pm25(float(pm25)), calculate_aqi_from_pm25(float(pm25))))
    if isinstance(pm10, (int, float)):
        candidates.append((calculate_us_aqi_from_pm10(float(pm10)), calculate_aqi_from_pm10(float(pm10))))
    if not candidates:
        eu_aqi = current.get("european_aqi")
        us_aqi = current.get("us_aqi")
        if isinstance(eu_aqi, (int, float)):
            candidates.append((float(us_aqi) if isinstance(us_aqi, (int, float)) else float(eu_aqi) * 4.0, float(eu_aqi) * 4.0))
        if isinstance(us_aqi, (int, float)):
            candidates.append((float(us_aqi), float(us_aqi)))
    if not candidates:
        return None

    us_value, cpcb_value = max(candidates, key=lambda item: item[0])
    payload = {
        "aqi_us": round(us_value, 1),
        "aqi_cpcb": round(cpcb_value, 1),
        "pm25": round(float(pm25), 1) if isinstance(pm25, (int, float)) else None,
        "pm10": round(float(pm10), 1) if isinstance(pm10, (int, float)) else None,
        "source": "openmeteo_air_quality",
        "category": get_us_aqi_category(us_value),
    }
    log_event("aqi_provider_hit", provider="openmeteo_air_quality", city=city, pm25=pm25, pm10=pm10, aqi_us=payload["aqi_us"], aqi_cpcb=payload["aqi_cpcb"])
    return payload

def select_best_payload(candidate_payloads: list[dict]) -> dict | None:
    if not candidate_payloads:
        return None
    return max(
        candidate_payloads,
        key=lambda payload: (
            float(payload.get("aqi_us", 0.0)),
            float(payload.get("aqi_cpcb", 0.0)),
            float(payload.get("pm25", 0.0) or 0.0),
            float(payload.get("pm10", 0.0) or 0.0),
        ),
    )


def calculate_aqi_from_pm25(pm25: float) -> float:
    """
    Calculates Indian CPCB AQI from PM2.5 concentration.
    Breakpoints (PM2.5):
    0-30: 0-50
    31-60: 51-100
    61-90: 101-200
    91-120: 201-300
    121-250: 301-400
    250+: 401-500
    """
    if pm25 <= 30.0:
        return (50.0 / 30.0) * pm25
    elif pm25 <= 60.0:
        return 51.0 + ((100.0 - 51.0) / (60.0 - 30.0)) * (pm25 - 30.0)
    elif pm25 <= 90.0:
        return 101.0 + ((200.0 - 101.0) / (90.0 - 60.0)) * (pm25 - 60.0)
    elif pm25 <= 120.0:
        return 201.0 + ((300.0 - 201.0) / (120.0 - 90.0)) * (pm25 - 90.0)
    elif pm25 <= 250.0:
        return 301.0 + ((400.0 - 301.0) / (250.0 - 120.0)) * (pm25 - 120.0)
    else:
        return 401.0 + ((500.0 - 401.0) / 250.0) * (pm25 - 250.0)

def calculate_aqi_from_pm10(pm10: float) -> float:
    """
    Calculates Indian CPCB AQI from PM10 concentration.
    Breakpoints (PM10):
    0-50: 0-50
    51-100: 51-100
    101-250: 101-200
    251-350: 201-300
    351-430: 301-400
    430+: 401-500
    """
    if pm10 <= 50.0:
        return pm10
    elif pm10 <= 100.0:
        return pm10
    elif pm10 <= 250.0:
        return 101.0 + ((200.0 - 101.0) / (250.0 - 100.0)) * (pm10 - 100.0)
    elif pm10 <= 350.0:
        return 201.0 + ((300.0 - 201.0) / (350.0 - 250.0)) * (pm10 - 250.0)
    elif pm10 <= 430.0:
        return 301.0 + ((400.0 - 301.0) / (430.0 - 350.0)) * (pm10 - 350.0)
    else:
        return 401.0 + ((500.0 - 401.0) / 70.0) * (pm10 - 430.0)

def get_cpcb_category(aqi: float) -> str:
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    else:
        return "Severe"


def calculate_us_aqi_from_pm25(pm25: float) -> float:
    if pm25 <= 12.0:
        return ((50.0 - 0.0) / (12.0 - 0.0)) * pm25
    elif pm25 <= 35.4:
        return 51.0 + ((100.0 - 51.0) / (35.4 - 12.1)) * (pm25 - 12.1)
    elif pm25 <= 55.4:
        return 101.0 + ((150.0 - 101.0) / (55.4 - 35.5)) * (pm25 - 35.5)
    elif pm25 <= 150.4:
        return 151.0 + ((200.0 - 151.0) / (150.4 - 55.5)) * (pm25 - 55.5)
    elif pm25 <= 250.4:
        return 201.0 + ((300.0 - 201.0) / (250.4 - 150.5)) * (pm25 - 150.5)
    elif pm25 <= 500.4:
        return 301.0 + ((500.0 - 301.0) / (500.4 - 250.5)) * (pm25 - 250.5)
    return 500.0


def calculate_us_aqi_from_pm10(pm10: float) -> float:
    if pm10 <= 54.0:
        return ((50.0 - 0.0) / (54.0 - 0.0)) * pm10
    elif pm10 <= 154.0:
        return 51.0 + ((100.0 - 51.0) / (154.0 - 55.0)) * (pm10 - 55.0)
    elif pm10 <= 254.0:
        return 101.0 + ((150.0 - 101.0) / (254.0 - 155.0)) * (pm10 - 155.0)
    elif pm10 <= 354.0:
        return 151.0 + ((200.0 - 151.0) / (354.0 - 255.0)) * (pm10 - 255.0)
    elif pm10 <= 424.0:
        return 201.0 + ((300.0 - 201.0) / (424.0 - 355.0)) * (pm10 - 355.0)
    elif pm10 <= 604.0:
        return 301.0 + ((500.0 - 301.0) / (604.0 - 425.0)) * (pm10 - 425.0)
    return 500.0


def get_us_aqi_category(aqi: float) -> str:
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"

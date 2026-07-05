"""
Simple in-memory TTL cache for external API results.
Prevents hammering OpenAQ/Open-Meteo on every page load.
"""
import time
from typing import Any, Optional

_cache: dict[str, tuple[Any, float]] = {}

def get(key: str) -> Optional[Any]:
    """Return cached value if still valid, else None."""
    if key in _cache:
        value, expires_at = _cache[key]
        if time.time() < expires_at:
            return value
        else:
            del _cache[key]
    return None

def set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Cache a value with a TTL (default 5 minutes)."""
    _cache[key] = (value, time.time() + ttl_seconds)

def clear() -> None:
    """Clear all cache entries."""
    _cache.clear()

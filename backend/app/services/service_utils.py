import asyncio
import json
import logging
import time
from collections import deque
from typing import Any, Optional

import httpx

logger = logging.getLogger("sarthi.services")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False

_RATE_LIMITS: dict[str, deque[float]] = {}
_CIRCUITS: dict[str, dict[str, Any]] = {}


def log_event(event: str, **fields: Any) -> None:
    logger.info(json.dumps({"event": event, **fields}, default=str))


def is_rate_limited(key: str, max_calls: int = 30, window_seconds: int = 60) -> bool:
    now = time.time()
    window = _RATE_LIMITS.setdefault(key, deque())
    while window and now - window[0] > window_seconds:
        window.popleft()
    if len(window) >= max_calls:
        return True
    window.append(now)
    return False


def circuit_allows(key: str) -> bool:
    state = _CIRCUITS.get(key)
    if not state:
        return True
    if state["open_until"] <= time.time():
        state["failures"] = 0
        state["open_until"] = 0.0
        return True
    return False


def record_success(key: str) -> None:
    _CIRCUITS[key] = {"failures": 0, "open_until": 0.0}


def record_failure(key: str, threshold: int = 3, cooldown_seconds: int = 60) -> None:
    state = _CIRCUITS.setdefault(key, {"failures": 0, "open_until": 0.0})
    state["failures"] += 1
    if state["failures"] >= threshold:
        state["open_until"] = time.time() + cooldown_seconds


async def fetch_json(
    url: str,
    *,
    params: Optional[dict[str, Any]] = None,
    headers: Optional[dict[str, str]] = None,
    timeout_seconds: float = 5.0,
    retries: int = 3,
    backoff_seconds: float = 0.5,
    service_name: str = "external_api",
) -> Optional[dict[str, Any]]:
    if not circuit_allows(service_name):
        log_event("circuit_open", service=service_name, url=url)
        return None

    if is_rate_limited(service_name):
        log_event("rate_limited", service=service_name, url=url)
        return None

    async with httpx.AsyncClient(timeout=timeout_seconds, follow_redirects=True) as client:
        for attempt in range(1, retries + 1):
            try:
                response = await client.get(url, params=params, headers=headers)
                if response.status_code == 429:
                    retry_after = response.headers.get("retry-after")
                    wait_seconds = float(retry_after) if retry_after and retry_after.isdigit() else backoff_seconds * attempt
                    log_event("http_429", service=service_name, url=url, attempt=attempt, wait_seconds=wait_seconds)
                    if attempt < retries:
                        await asyncio.sleep(wait_seconds)
                        continue
                    record_failure(service_name)
                    return None

                if response.status_code >= 500:
                    raise httpx.HTTPStatusError(
                        f"{response.status_code} server error",
                        request=response.request,
                        response=response,
                    )

                response.raise_for_status()
                record_success(service_name)
                return response.json()
            except Exception as exc:
                record_failure(service_name)
                log_event("request_failed", service=service_name, url=url, attempt=attempt, error=str(exc))
                if attempt < retries:
                    await asyncio.sleep(backoff_seconds * (2 ** (attempt - 1)))
                    continue
                return None

    return None
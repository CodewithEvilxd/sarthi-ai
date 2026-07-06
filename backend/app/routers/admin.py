from fastapi import APIRouter
from typing import List, Dict, Any
from app.services import gemini_service, service_utils

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/providers")
def providers_status() -> Dict[str, Any]:
    """Return non-sensitive provider status: masked Gemini key suffixes and OpenAI presence."""
    keys: List[str] = getattr(gemini_service, "_GEMINI_API_KEYS", []) or []
    masked = []
    for i, k in enumerate(keys):
        suf = k[-8:] if k and len(k) > 8 else k
        masked.append({"index": i + 1, "suffix": suf, "configured": True})

    return {
        "gemini_keys_count": len(keys),
        "gemini_keys": masked,
        "openai_configured": gemini_service._has_openai_credentials(),
        "circuits": service_utils.get_circuit_status(),
        "last_provider": gemini_service.get_last_provider()
    }

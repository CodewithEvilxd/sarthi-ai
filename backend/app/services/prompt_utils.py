import re
from typing import Tuple


def compact_prompt(text: str, max_length: int = 1200) -> str:
    """Compact prompts to reduce token usage.

    - Collapse whitespace
    - Remove extraneous examples and long docstrings
    - Truncate to `max_length` characters preserving start and end
    """
    if not text:
        return text
    # collapse whitespace
    s = re.sub(r"\s+", " ", text).strip()

    if len(s) <= max_length:
        return s

    # preserve head and tail
    head_len = max_length // 2
    tail_len = max_length - head_len - 3
    return s[:head_len] + "..." + s[-tail_len:]


def short_system_instruction(role: str) -> str:
    """Return a short system instruction for common agents to save tokens."""
    role = (role or "").lower()
    if "health" in role:
        return "Respond concisely citing referenced guidelines. Keep answers short."
    if "environment" in role:
        return "Provide a short JSON with safety recommendations. Be concise."
    return "Answer concisely and directly."

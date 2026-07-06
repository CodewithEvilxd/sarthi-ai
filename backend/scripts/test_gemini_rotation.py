"""Test Gemini key rotation by calling generate_text multiple times.

Run from backend folder with the virtualenv active:

python -m backend.scripts.test_gemini_rotation

Or:
python backend/scripts/test_gemini_rotation.py
"""
import time
import sys
from pathlib import Path

# Ensure repository `backend` package is importable when running from any cwd
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.gemini_service import generate_text

PROMPT = "Test rotation: Return a short token string indicating which key was used (mock friendly)."


def main():
    for i in range(1, 7):
        try:
            print(f"Call {i}:", end=" ")
            res = generate_text(PROMPT)
            print(res[:200].replace('\n',' '))
        except Exception as e:
            print("ERROR:", e)
        time.sleep(0.5)


if __name__ == '__main__':
    main()

import unittest

from app.services.gemini_service import generate_mock_text


class ChatFallbackTests(unittest.TestCase):
    def test_greeting_response_is_friendly(self):
        response = generate_mock_text("Hello there")
        self.assertIn("Hello", response)
        self.assertIn("help", response.lower())

    def test_bp_query_still_returns_clinical_guidance(self):
        response = generate_mock_text("What does a BP of 140/90 mean?")
        self.assertIn("Hypertension", response)
        self.assertIn("140/90", response)


if __name__ == "__main__":
    unittest.main()

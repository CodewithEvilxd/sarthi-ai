import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_api_keys: str = ""
    openai_api_key: str = ""
    openai_api_base: str = "https://api.openai.com/v1"
    openaq_api_key: str = ""
    database_url: str = "sqlite:///./sarthi_ai.db"
    env: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Check environment fallback if not loaded from .env
if not settings.gemini_api_key:
    settings.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
if not settings.gemini_api_keys:
    settings.gemini_api_keys = os.getenv("GEMINI_API_KEYS", "")
if not settings.openai_api_key:
    settings.openai_api_key = os.getenv("OPENAI_API_KEY", "")
if not settings.openai_api_base:
    settings.openai_api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
if not settings.openaq_api_key:
    settings.openaq_api_key = os.getenv("OPENAQ_API_KEY", "")

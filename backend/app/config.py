import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    gemini_api_key: str = ""
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
if not settings.openaq_api_key:
    settings.openaq_api_key = os.getenv("OPENAQ_API_KEY", "")

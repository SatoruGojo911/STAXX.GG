"""Application configuration loaded from environment variables."""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central settings object – values come from env vars or .env file."""

    # General
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017/staxx"
    MONGODB_DATABASE: str = "staxx"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth – Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Session / cookies
    SESSION_SECRET: str = "change-me-in-production-must-be-at-least-32-chars"
    COOKIE_DOMAIN: str = "localhost"

    # PokeAPI (informational – data ingestion handled separately)
    POKEAPI_BASE_URL: str = "https://pokeapi.co/api/v2"
    DATA_VERSION: int = 1

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    # ---------- derived helpers ----------
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def cookie_secure(self) -> bool:
        return self.is_production

    @property
    def cookie_samesite(self) -> str:
        return "lax" if self.is_production else "lax"


settings = Settings()

"""Application configuration and environment-based settings."""

from functools import lru_cache
from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


class Settings:
    """Runtime settings loaded from environment variables."""

    def __init__(self) -> None:
        self.api_host = os.getenv("API_HOST", "127.0.0.1")
        self.api_port = int(os.getenv("API_PORT", "8000"))
        self.api_env = os.getenv("API_ENV", "development")

        raw_cors_origins = os.getenv("CORS_ORIGINS", "*")
        self.cors_origins = [
            origin.strip() for origin in raw_cors_origins.split(",") if origin.strip()
        ] or ["*"]

        configured_service_account = os.getenv(
            "FIREBASE_SERVICE_ACCOUNT_PATH",
            "./../serviceAccountKey.json",
        )
        service_account_path = Path(configured_service_account)
        if not service_account_path.is_absolute():
            service_account_path = (BASE_DIR / service_account_path).resolve()
        self.firebase_service_account_path = service_account_path
        # Optional: explicit Firebase Storage bucket name (e.g. project-id.appspot.com)
        self.firebase_storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()

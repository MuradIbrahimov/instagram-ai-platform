from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Instagram DM AI Platform"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    app_version: str = "0.1.0"
    secret_key: str
    access_token_expire_minutes: int = 10080

    postgres_host: str
    postgres_port: int = 5432
    postgres_db: str
    postgres_user: str
    postgres_password: str

    redis_url: str
    celery_broker_url: str
    celery_result_backend: str
    openai_api_key: str
    openai_model: str = "gpt-4.1-mini"
    meta_app_id: str
    meta_app_secret: str
    meta_verify_token: str
    meta_graph_api_version: str = "v23.0"
    encryption_key: str
    frontend_url: str = "http://localhost:5173"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def async_database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip().rstrip("/") for origin in self.frontend_url.split(",") if origin.strip()]
        return origins or ["http://localhost:5173"]

    @model_validator(mode="after")
    def validate_sensitive_values(self) -> "Settings":
        invalid_values = {
            "",
            "default",
            "changeme",
            "change_me",
            "change-me",
            "your-secret-key",
            "your-encryption-key",
            "secret",
        }

        if self.secret_key.lower() in invalid_values:
            raise ValueError("SECRET_KEY must be set to a non-default value")
        if self.encryption_key.lower() in invalid_values:
            raise ValueError("ENCRYPTION_KEY must be set to a non-default value")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()

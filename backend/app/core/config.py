from functools import lru_cache
from typing import Literal

from pydantic import ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.example"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Instagram DM AI Platform"
    app_env: Literal["local", "development", "staging", "production"] = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"
    cors_origins: list[str] = ["*"]

    database_url: str
    database_url_sync: str | None = None
    redis_url: str
    celery_broker_url: str
    celery_result_backend: str

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            if not value.strip():
                return []
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("database_url_sync", mode="before")
    @classmethod
    def build_sync_database_url(
        cls,
        value: str | None,
        info: ValidationInfo,
    ) -> str | None:
        if value:
            return value
        database_url = info.data.get("database_url")
        if isinstance(database_url, str):
            return database_url.replace("+asyncpg", "+psycopg")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()

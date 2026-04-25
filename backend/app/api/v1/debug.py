"""Debug endpoints — only active when DEBUG=true."""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.core.config import Settings, get_settings

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/config")
async def debug_config(settings: Settings = Depends(get_settings)) -> JSONResponse:
    """Returns non-sensitive config values so you can confirm what .env was loaded."""
    return JSONResponse({
        "app_env": settings.app_env,
        "debug": settings.debug,
        "api_v1_prefix": settings.api_v1_prefix,
        "cors_origins": settings.cors_origins,
        "frontend_url": settings.frontend_url,
        "postgres_host": settings.postgres_host,
        "postgres_port": settings.postgres_port,
        "postgres_db": settings.postgres_db,
        "redis_url": settings.redis_url,
        "access_token_expire_minutes": settings.access_token_expire_minutes,
        # Confirm secrets are loaded without exposing them
        "secret_key_set": bool(settings.secret_key),
        "encryption_key_set": bool(settings.encryption_key),
    })


@router.get("/health-verbose")
async def debug_health_verbose(settings: Settings = Depends(get_settings)) -> JSONResponse:
    """Verbose health — checks DB + Redis connectivity and reports details."""
    from app.core.database import SessionLocal
    from app.core.redis import ping_redis
    from app.repositories.health_repository import HealthRepository

    db_ok = False
    db_error: str | None = None
    try:
        async with SessionLocal() as session:
            db_ok = await HealthRepository(session).is_database_reachable()
    except Exception as exc:  # noqa: BLE001
        db_error = str(exc)

    redis_ok = False
    redis_error: str | None = None
    try:
        redis_ok = await ping_redis()
    except Exception as exc:  # noqa: BLE001
        redis_error = str(exc)

    return JSONResponse({
        "database": {"ok": db_ok, "error": db_error},
        "redis": {"ok": redis_ok, "error": redis_error},
        "cors_origins": settings.cors_origins,
    })

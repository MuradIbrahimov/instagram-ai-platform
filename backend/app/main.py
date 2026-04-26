from contextlib import asynccontextmanager
from collections.abc import AsyncIterator, Awaitable, Callable
from time import perf_counter
import uuid

import structlog
from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse, Response

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import SessionLocal, engine, sync_engine
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    http_exception_handler,
    request_validation_exception_handler,
    unhandled_exception_handler,
)
from app.core.logging import get_logger, setup_logging
from app.core.rate_limiter import limiter
from app.core.redis import ping_redis, redis_client
from app.repositories.health_repository import HealthRepository
from app.schemas.health import HealthResponse
from app.services.health_service import HealthService, get_health_service

logger = get_logger(__name__)


def validate_environment(settings) -> None:  # type: ignore[no-untyped-def]
    """Validate critical environment settings at startup.

    Raises RuntimeError with a clear message if any check fails.
    Should NOT run in test environment.
    """
    if settings.app_env == "test":
        return

    dangerous_values = {"change-me", "changeme", "change_me", "default", "secret"}
    if settings.secret_key.lower() in dangerous_values:
        raise RuntimeError(
            "SECRET_KEY must be set to a secure random value — "
            "current value is a placeholder."
        )

    import base64
    import hashlib
    from cryptography.fernet import Fernet

    try:
        key_material = settings.encryption_key.encode("utf-8")
        digest = hashlib.sha256(key_material).digest()
        Fernet(base64.urlsafe_b64encode(digest))
    except ValueError as exc:
        raise RuntimeError(
            f"ENCRYPTION_KEY cannot be used to construct a Fernet key: {exc}"
        ) from exc

    if not settings.meta_verify_token or not settings.meta_verify_token.strip():
        raise RuntimeError("META_VERIFY_TOKEN must be set to a non-empty value.")

    if settings.app_env == "production" and settings.debug:
        raise RuntimeError(
            "DEBUG must be False in production. Set APP_ENV=production and DEBUG=false."
        )


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(
        app_env=settings.app_env,
        log_level="DEBUG" if settings.debug else "INFO",
    )
    validate_environment(settings)

    async with SessionLocal() as session:
        db_ok = await HealthRepository(session).is_database_reachable()
    redis_ok = await ping_redis()

    logger.info(
        "application_startup_complete",
        environment=settings.app_env,
        database_status="ok" if db_ok else "down",
        redis_status="ok" if redis_ok else "down",
    )
    yield
    await redis_client.aclose()
    await engine.dispose()
    sync_engine.dispose()
    logger.info("application_shutdown_complete")


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
    )

    # Attach the rate limiter to app state
    application.state.limiter = limiter
    application.add_middleware(SlowAPIMiddleware)

    # Custom 429 handler matching our error format
    async def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content={"detail": {"code": "rate_limit_exceeded", "message": "Too many requests"}},
        )

    application.add_exception_handler(RateLimitExceeded, _rate_limit_handler)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def request_logging_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        start = perf_counter()
        try:
            response = await call_next(request)
            duration_ms = round((perf_counter() - start) * 1000, 2)
            logger.info(
                "http_request",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=duration_ms,
            )
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            structlog.contextvars.clear_contextvars()

    @application.get("/health", response_model=HealthResponse, include_in_schema=False)
    async def health_root(
        health_service: HealthService = Depends(get_health_service),
    ) -> HealthResponse:
        return await health_service.get_health()

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    application.add_exception_handler(AppException, app_exception_handler)
    application.add_exception_handler(StarletteHTTPException, http_exception_handler)
    application.add_exception_handler(
        RequestValidationError,
        request_validation_exception_handler,
    )
    application.add_exception_handler(Exception, unhandled_exception_handler)
    return application


app = create_app()

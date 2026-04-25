from contextlib import asynccontextmanager
from collections.abc import AsyncIterator, Awaitable, Callable
from time import perf_counter
import uuid

import structlog
from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

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
from app.core.redis import ping_redis, redis_client
from app.repositories.health_repository import HealthRepository
from app.schemas.health import HealthResponse
from app.services.health_service import HealthService, get_health_service

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(
        app_env=settings.app_env,
        log_level="DEBUG" if settings.debug else "INFO",
    )

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

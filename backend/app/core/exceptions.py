from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import get_logger

logger = get_logger(__name__)


class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def build_error_payload(code: str, message: str) -> dict[str, dict[str, str]]:
    return {"detail": {"code": code, "message": message}}


async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_payload(code=exc.code, message=exc.message),
    )


async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    message = str(exc.detail) if exc.detail else "HTTP error"
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_payload(code="http_error", message=message),
    )


async def request_validation_exception_handler(
    _: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    first_error = exc.errors()[0] if exc.errors() else None
    message = first_error.get("msg", "Validation error") if first_error else "Validation error"
    return JSONResponse(
        status_code=422,
        content=build_error_payload(code="validation_error", message=message),
    )


async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled_exception", error=str(exc))
    return JSONResponse(
        status_code=500,
        content=build_error_payload(
            code="internal_server_error",
            message="Something went wrong",
        ),
    )

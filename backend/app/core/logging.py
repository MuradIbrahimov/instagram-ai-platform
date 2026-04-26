import sys
from typing import Any

import logging

import structlog
from structlog.typing import FilteringBoundLogger

_SENSITIVE_KEYS: frozenset[str] = frozenset({
    "password",
    "password_hash",
    "access_token",
    "access_token_encrypted",
    "secret",
    "authorization",
    "x-hub-signature-256",
    "encryption_key",
})


def _redact(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {
            k: "[REDACTED]" if k.lower() in _SENSITIVE_KEYS else _redact(v)
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [_redact(item) for item in obj]
    return obj


def _redact_sensitive_processor(
    _logger: Any,
    _method_name: str,
    event_dict: dict[str, Any],
) -> dict[str, Any]:
    """Structlog processor: redact sensitive keys before log output."""
    return _redact(event_dict)


def setup_logging(app_env: str, log_level: str) -> None:
    level = getattr(logging, log_level.upper(), logging.INFO)
    renderer = (
        structlog.dev.ConsoleRenderer()
        if app_env == "development"
        else structlog.processors.JSONRenderer()
    )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
        force=True,
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.filter_by_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            _redact_sensitive_processor,
            renderer,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> FilteringBoundLogger:
    return structlog.get_logger(name)

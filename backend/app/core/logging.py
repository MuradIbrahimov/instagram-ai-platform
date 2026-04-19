import sys

import logging

import structlog
from structlog.typing import FilteringBoundLogger


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
            renderer,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> FilteringBoundLogger:
    return structlog.get_logger(name)

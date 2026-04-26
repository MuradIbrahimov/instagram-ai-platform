"""Application-wide rate limiter (slowapi).

Key function:
- In test environments: returns a unique UUID per request so rate limits
  are never hit during tests.
- In all other environments: uses the real client IP.
"""
from __future__ import annotations

import uuid

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def _rate_limit_key(request: Request) -> str:
    # Import here to avoid a circular import at module load time.
    from app.core.config import get_settings  # noqa: PLC0415

    if get_settings().app_env == "test":
        # Each request gets a unique key → counter is always 1 → limit never hit.
        return str(uuid.uuid4())
    return get_remote_address(request)


limiter = Limiter(key_func=_rate_limit_key)

"""Audit logging service.

log_action() is fire-and-forget: it never raises. Any failure is logged
internally and silently swallowed so callers are never impacted.
"""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.audit_log import AuditLog

logger = get_logger(__name__)


async def log_action(
    db: AsyncSession,
    action: str,
    target_type: str,
    target_id: str,
    workspace_id: uuid.UUID | None = None,
    actor_user_id: uuid.UUID | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Write an audit log record.

    Never raises — any error is caught and logged at WARNING level.
    """
    try:
        entry = AuditLog(
            workspace_id=workspace_id,
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            metadata_json=metadata or {},
        )
        db.add(entry)
        await db.flush()
    except Exception as exc:
        logger.warning(
            "audit_log_write_failed",
            action=action,
            target_type=target_type,
            target_id=target_id,
            error=str(exc),
        )

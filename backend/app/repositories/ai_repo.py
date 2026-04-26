"""Repository for ai_runs table."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_run import AiRun, AiRunStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AiRunRepository:
    async def create_run(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        conversation_id: uuid.UUID,
        trigger_message_id: uuid.UUID,
        model_name: str,
        system_prompt_version: str,
    ) -> AiRun:
        run = AiRun(
            workspace_id=workspace_id,
            conversation_id=conversation_id,
            trigger_message_id=trigger_message_id,
            model_name=model_name,
            system_prompt_version=system_prompt_version,
            status=AiRunStatus.QUEUED,
        )
        db.add(run)
        await db.flush()
        await db.refresh(run)
        return run

    async def update_run(
        self,
        db: AsyncSession,
        run_id: uuid.UUID,
        **fields: object,
    ) -> AiRun:
        run = await db.get(AiRun, run_id)
        if run is None:
            raise RuntimeError(f"AiRun {run_id} not found")
        for key, value in fields.items():
            setattr(run, key, value)
        await db.flush()
        await db.refresh(run)
        return run

    async def get_by_id(
        self,
        db: AsyncSession,
        run_id: uuid.UUID,
    ) -> AiRun | None:
        result = await db.execute(select(AiRun).where(AiRun.id == run_id))
        return result.scalar_one_or_none()

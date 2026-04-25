from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook_event import WebhookEvent


class WebhookEventRepository:
    async def get_by_hash(self, db: AsyncSession, event_id_hash: str) -> WebhookEvent | None:
        result = await db.execute(
            select(WebhookEvent).where(WebhookEvent.event_id_hash == event_id_hash)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        event_type: str,
        event_id_hash: str,
        payload: dict[str, Any],
    ) -> WebhookEvent:
        webhook_event = WebhookEvent(
            provider="meta",
            event_type=event_type,
            event_id_hash=event_id_hash,
            payload=payload,
            processed=False,
        )
        db.add(webhook_event)
        try:
            await db.flush()
            await db.refresh(webhook_event)
            return webhook_event
        except IntegrityError:
            raise

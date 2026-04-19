import uuid
from collections.abc import Mapping
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message, MessageDirection


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MessageRepository:
    async def create(self, db: AsyncSession, data: Mapping[str, object]) -> Message:
        message = Message(**dict(data))
        db.add(message)
        await db.flush()
        await db.refresh(message)

        update_payload: dict[str, object] = {
            "last_message_at": message.created_at,
        }
        if message.direction == MessageDirection.INBOUND:
            update_payload["last_inbound_at"] = message.created_at
            update_payload["unread_count"] = Conversation.unread_count + 1
        else:
            update_payload["last_outbound_at"] = message.created_at

        await db.execute(
            update(Conversation)
            .where(
                Conversation.id == message.conversation_id,
                Conversation.workspace_id == message.workspace_id,
            )
            .values(**update_payload)
        )
        return message

    async def get_by_external_id(
        self,
        db: AsyncSession,
        external_id: str,
    ) -> Message | None:
        result = await db.execute(
            select(Message).where(Message.external_message_id == external_id)
        )
        return result.scalar_one_or_none()

    async def list_for_conversation(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> list[Message]:
        query = (
            select(Message)
            .where(
                Message.conversation_id == conversation_id,
                Message.workspace_id == workspace_id,
            )
            .order_by(Message.created_at.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_recent(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
        limit: int = 20,
    ) -> list[Message]:
        query = (
            select(Message)
            .where(
                Message.conversation_id == conversation_id,
                Message.workspace_id == workspace_id,
            )
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(query)
        rows = list(result.scalars().all())
        rows.reverse()
        return rows

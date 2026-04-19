import uuid
from collections.abc import Mapping
from datetime import datetime, timezone

from sqlalchemy import Select, or_, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.schemas.conversations import ConversationFilters


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ConversationRepository:
    async def upsert(
        self,
        db: AsyncSession,
        instagram_account_id: uuid.UUID,
        customer_ig_user_id: str,
        workspace_id: uuid.UUID,
        **defaults: object,
    ) -> Conversation:
        values: dict[str, object] = {
            "instagram_account_id": instagram_account_id,
            "customer_ig_user_id": customer_ig_user_id,
            "workspace_id": workspace_id,
            **defaults,
        }

        on_conflict_values: dict[str, object] = {
            "updated_at": utc_now(),
        }
        for key in [
            "customer_username",
            "customer_display_name",
            "last_message_at",
            "last_inbound_at",
            "last_outbound_at",
            "status",
        ]:
            if key in defaults:
                on_conflict_values[key] = defaults[key]

        stmt = (
            insert(Conversation)
            .values(**values)
            .on_conflict_do_update(
                index_elements=[
                    Conversation.instagram_account_id,
                    Conversation.customer_ig_user_id,
                ],
                set_=on_conflict_values,
            )
            .returning(Conversation.id)
        )

        result = await db.execute(stmt)
        conversation_id = result.scalar_one()
        conversation = await self.get_by_id(db=db, conversation_id=conversation_id, workspace_id=workspace_id)
        if conversation is None:
            raise RuntimeError("Failed to load conversation after upsert")
        return conversation

    async def get_by_id(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> Conversation | None:
        query = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.workspace_id == workspace_id,
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def list(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        filters: ConversationFilters,
        page: int,
        page_size: int,
    ) -> list[Conversation]:
        query: Select[tuple[Conversation]] = select(Conversation).where(
            Conversation.workspace_id == workspace_id,
        )

        if filters.status is not None:
            query = query.where(Conversation.status == filters.status)
        if filters.instagram_account_id is not None:
            query = query.where(Conversation.instagram_account_id == filters.instagram_account_id)
        if filters.assigned_user_id is not None:
            query = query.where(Conversation.assigned_user_id == filters.assigned_user_id)
        if filters.ai_paused is not None:
            query = query.where(Conversation.ai_paused == filters.ai_paused)
        if filters.unread_only:
            query = query.where(Conversation.unread_count > 0)
        if filters.search:
            term = f"%{filters.search.strip()}%"
            query = query.where(
                or_(
                    Conversation.customer_username.ilike(term),
                    Conversation.customer_display_name.ilike(term),
                    Conversation.customer_ig_user_id.ilike(term),
                )
            )

        query = query.order_by(
            Conversation.last_message_at.desc().nullslast(),
            Conversation.created_at.desc(),
        )
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def update(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: Mapping[str, object],
    ) -> Conversation | None:
        conversation = await self.get_by_id(
            db=db,
            conversation_id=conversation_id,
            workspace_id=workspace_id,
        )
        if conversation is None:
            return None

        for key, value in dict(data).items():
            setattr(conversation, key, value)

        await db.flush()
        await db.refresh(conversation)
        return conversation

    async def increment_unread(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> None:
        stmt = (
            update(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.workspace_id == workspace_id,
            )
            .values(unread_count=Conversation.unread_count + 1)
        )
        await db.execute(stmt)

    async def reset_unread(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> None:
        stmt = (
            update(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.workspace_id == workspace_id,
            )
            .values(unread_count=0)
        )
        await db.execute(stmt)

    async def set_ai_paused(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
        paused: bool,
    ) -> Conversation | None:
        await db.execute(
            update(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.workspace_id == workspace_id,
            )
            .values(ai_paused=paused)
        )
        return await self.get_by_id(db=db, conversation_id=conversation_id, workspace_id=workspace_id)

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.conversation import Conversation
from app.repositories.conversation_repo import ConversationRepository
from app.schemas.conversations import (
    ConversationFilters,
    ConversationListItem,
    ConversationResponse,
    ConversationUpdate,
)
from app.services.audit_service import log_action


class ConversationService:
    def __init__(self, conversation_repo: ConversationRepository) -> None:
        self.conversation_repo = conversation_repo

    async def get_conversation(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> ConversationResponse:
        conversation = await self.conversation_repo.get_by_id(
            db=db,
            conversation_id=conversation_id,
            workspace_id=workspace_id,
        )
        if conversation is None:
            raise AppException(
                code="conversation_not_found",
                message="Conversation not found",
                status_code=404,
            )
        return self._to_response(conversation)

    async def list_conversations(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        filters: ConversationFilters,
        page: int,
        page_size: int,
    ) -> list[ConversationListItem]:
        conversations = await self.conversation_repo.list(
            db=db,
            workspace_id=workspace_id,
            filters=filters,
            page=page,
            page_size=page_size,
        )
        return [self._to_list_item(conversation) for conversation in conversations]

    async def update_conversation(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: ConversationUpdate,
    ) -> ConversationResponse:
        updated = await self.conversation_repo.update(
            db=db,
            conversation_id=conversation_id,
            workspace_id=workspace_id,
            data=data.model_dump(exclude_unset=True),
        )
        if updated is None:
            raise AppException(
                code="conversation_not_found",
                message="Conversation not found",
                status_code=404,
            )
        return self._to_response(updated)

    async def assign(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> ConversationResponse:
        updated = await self.conversation_repo.update(
            db=db,
            conversation_id=conversation_id,
            workspace_id=workspace_id,
            data={"assigned_user_id": user_id},
        )
        if updated is None:
            raise AppException(
                code="conversation_not_found",
                message="Conversation not found",
                status_code=404,
            )
        await log_action(
            db=db,
            action="conversation.assigned",
            target_type="conversation",
            target_id=str(conversation_id),
            workspace_id=workspace_id,
            metadata={"assigned_user_id": str(user_id)},
        )
        return self._to_response(updated)

    async def pause_ai(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> ConversationResponse:
        conversation = await self.conversation_repo.set_ai_paused(
            db=db,
            conversation_id=conversation_id,
            workspace_id=workspace_id,
            paused=True,
        )
        if conversation is None:
            raise AppException(
                code="conversation_not_found",
                message="Conversation not found",
                status_code=404,
            )
        await log_action(
            db=db,
            action="conversation.ai_paused",
            target_type="conversation",
            target_id=str(conversation_id),
            workspace_id=workspace_id,
        )
        return self._to_response(conversation)

    async def resume_ai(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> ConversationResponse:
        conversation = await self.conversation_repo.set_ai_paused(
            db=db,
            conversation_id=conversation_id,
            workspace_id=workspace_id,
            paused=False,
        )
        if conversation is None:
            raise AppException(
                code="conversation_not_found",
                message="Conversation not found",
                status_code=404,
            )
        await log_action(
            db=db,
            action="conversation.ai_resumed",
            target_type="conversation",
            target_id=str(conversation_id),
            workspace_id=workspace_id,
        )
        return self._to_response(conversation)

    async def mark_read(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> ConversationResponse:
        await self.conversation_repo.reset_unread(
            db=db,
            conversation_id=conversation_id,
            workspace_id=workspace_id,
        )
        return await self.get_conversation(
            db=db,
            conversation_id=conversation_id,
            workspace_id=workspace_id,
        )

    def _to_response(self, conversation: Conversation) -> ConversationResponse:
        return ConversationResponse(
            id=conversation.id,
            workspace_id=conversation.workspace_id,
            instagram_account_id=conversation.instagram_account_id,
            customer_ig_user_id=conversation.customer_ig_user_id,
            customer_username=conversation.customer_username,
            customer_display_name=conversation.customer_display_name,
            status=conversation.status,
            assigned_user_id=conversation.assigned_user_id,
            last_message_at=conversation.last_message_at,
            last_inbound_at=conversation.last_inbound_at,
            last_outbound_at=conversation.last_outbound_at,
            unread_count=conversation.unread_count,
            ai_paused=conversation.ai_paused,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
        )

    def _to_list_item(self, conversation: Conversation) -> ConversationListItem:
        return ConversationListItem(
            id=conversation.id,
            customer_username=conversation.customer_username,
            customer_display_name=conversation.customer_display_name,
            status=conversation.status,
            unread_count=conversation.unread_count,
            last_message_at=conversation.last_message_at,
            ai_paused=conversation.ai_paused,
            assigned_user_id=conversation.assigned_user_id,
            instagram_account_id=conversation.instagram_account_id,
        )


def get_conversation_service() -> ConversationService:
    return ConversationService(conversation_repo=ConversationRepository())

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.conversation import Conversation
from app.models.message import Message, MessageDirection, MessageStatus, SenderType
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.message_repo import MessageRepository
from app.schemas.messages import MessageResponse


class MessageService:
    def __init__(
        self,
        message_repo: MessageRepository,
        conversation_repo: ConversationRepository,
    ) -> None:
        self.message_repo = message_repo
        self.conversation_repo = conversation_repo

    async def create_outbound(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
        text_content: str | None,
        sender_type: str = "human",
    ) -> MessageResponse:
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

        message = await self.message_repo.create(
            db=db,
            data={
                "conversation_id": conversation.id,
                "workspace_id": workspace_id,
                "instagram_account_id": conversation.instagram_account_id,
                "sender_type": SenderType(sender_type),
                "direction": MessageDirection.OUTBOUND,
                "text_content": text_content,
                "status": MessageStatus.QUEUED,
            },
        )
        return self._to_response(message)

    async def list_messages(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        workspace_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> list[MessageResponse]:
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

        messages = await self.message_repo.list_for_conversation(
            db=db,
            conversation_id=conversation_id,
            workspace_id=workspace_id,
            page=page,
            page_size=page_size,
        )
        return [self._to_response(message) for message in messages]

    def _to_response(self, message: Message) -> MessageResponse:
        return MessageResponse(
            id=message.id,
            conversation_id=message.conversation_id,
            sender_type=message.sender_type,
            direction=message.direction,
            message_type=message.message_type,
            text_content=message.text_content,
            status=message.status,
            created_at=message.created_at,
        )


def get_message_service() -> MessageService:
    return MessageService(
        message_repo=MessageRepository(),
        conversation_repo=ConversationRepository(),
    )

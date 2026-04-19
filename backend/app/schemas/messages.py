import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.message import MessageStatus, MessageType, MessageDirection, SenderType


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_type: SenderType
    direction: MessageDirection
    message_type: MessageType
    text_content: str | None
    status: MessageStatus
    created_at: datetime


class MessageCreate(BaseModel):
    text_content: str | None = Field(default=None, max_length=10000)
    message_type: MessageType = MessageType.TEXT

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

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
    text_content: str | None = Field(default=None, max_length=1000)
    message_type: MessageType = MessageType.TEXT

    @field_validator("text_content", mode="before")
    @classmethod
    def strip_text(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.strip() or None
        return v

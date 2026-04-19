import enum
from datetime import datetime, timezone
import uuid
from typing import Any

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SenderType(str, enum.Enum):
    CUSTOMER = "customer"
    AI = "ai"
    HUMAN = "human"
    SYSTEM = "system"


class MessageDirection(str, enum.Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class MessageType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    STORY_REPLY = "story_reply"
    ATTACHMENT = "attachment"
    SYSTEM = "system"


class MessageStatus(str, enum.Enum):
    RECEIVED = "received"
    QUEUED = "queued"
    SENT = "sent"
    FAILED = "failed"


class Message(Base, UUIDPrimaryKeyModel):
    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_conversation_id", "conversation_id"),
        Index("ix_messages_workspace_id", "workspace_id"),
        Index("ix_messages_external_message_id", "external_message_id"),
        Index("ix_messages_created_at", "created_at"),
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    instagram_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("instagram_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    external_message_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    sender_type: Mapped[SenderType] = mapped_column(
        Enum(
            SenderType,
            name="sender_type",
            native_enum=True,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    direction: Mapped[MessageDirection] = mapped_column(
        Enum(
            MessageDirection,
            name="message_direction",
            native_enum=True,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    message_type: Mapped[MessageType] = mapped_column(
        Enum(
            MessageType,
            name="message_type",
            native_enum=True,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=MessageType.TEXT,
        server_default=text("'text'"),
    )
    text_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    reply_to_message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    status: Mapped[MessageStatus] = mapped_column(
        Enum(
            MessageStatus,
            name="message_status",
            native_enum=True,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=MessageStatus.RECEIVED,
        server_default=text("'received'"),
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=text("TIMEZONE('utc', NOW())"),
    )

    conversation = relationship("Conversation")

import enum
from datetime import datetime
import uuid

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampedModel, UUIDPrimaryKeyModel


class ConversationStatus(str, enum.Enum):
    OPEN = "open"
    PENDING = "pending"
    CLOSED = "closed"
    HANDOFF = "handoff"


class Conversation(Base, UUIDPrimaryKeyModel, TimestampedModel):
    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint(
            "instagram_account_id",
            "customer_ig_user_id",
            name="uq_conversation_account_customer",
        ),
        Index("ix_conversations_workspace_id", "workspace_id"),
        Index("ix_conversations_status", "status"),
        Index("ix_conversations_assigned_user_id", "assigned_user_id"),
        Index("ix_conversations_last_message_at", "last_message_at"),
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
    customer_ig_user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    customer_username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[ConversationStatus] = mapped_column(
        Enum(
            ConversationStatus,
            name="conversation_status",
            native_enum=True,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=ConversationStatus.OPEN,
        server_default=text("'open'"),
    )
    assigned_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_inbound_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_outbound_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    unread_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    ai_paused: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    workspace = relationship("Workspace")
    instagram_account = relationship("InstagramAccount")
    assigned_user = relationship("User")

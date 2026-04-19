import enum
from datetime import datetime
import uuid

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampedModel, UUIDPrimaryKeyModel


class ReplyMode(str, enum.Enum):
    AUTOMATIC = "automatic"
    APPROVAL_REQUIRED = "approval_required"
    HUMAN_ONLY = "human_only"


class InstagramAccount(Base, UUIDPrimaryKeyModel, TimestampedModel):
    __tablename__ = "instagram_accounts"
    __table_args__ = (
        Index("ix_instagram_accounts_workspace_id", "workspace_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    instagram_account_id: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
    )
    instagram_username: Mapped[str] = mapped_column(String(255), nullable=False)
    facebook_page_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    page_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    access_token_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    auto_reply_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )
    reply_mode: Mapped[ReplyMode] = mapped_column(
        Enum(
            ReplyMode,
            name="reply_mode",
            native_enum=True,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=ReplyMode.AUTOMATIC,
        server_default=text("'automatic'"),
    )
    confidence_threshold: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.75,
        server_default=text("0.75"),
    )
    business_hours_only: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    workspace = relationship("Workspace")

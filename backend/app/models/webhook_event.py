from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class WebhookEvent(Base, UUIDPrimaryKeyModel):
    __tablename__ = "webhook_events"
    __table_args__ = (
        Index("ix_webhook_events_event_id_hash", "event_id_hash", unique=True),
        Index("ix_webhook_events_processed", "processed"),
    )

    provider: Mapped[str] = mapped_column(String(50), nullable=False, default="meta", server_default=text("'meta'"))
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_id_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    processed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=text("TIMEZONE('utc', NOW())"),
    )

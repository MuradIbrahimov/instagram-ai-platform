from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DocumentSourceType(str, enum.Enum):
    MANUAL = "manual"
    URL = "url"


class DocumentStatus(str, enum.Enum):
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class KnowledgeDocument(Base, UUIDPrimaryKeyModel):
    __tablename__ = "knowledge_documents"
    __table_args__ = (
        Index("ix_knowledge_documents_workspace_id", "workspace_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    source_type: Mapped[DocumentSourceType] = mapped_column(
        Enum(
            DocumentSourceType,
            name="document_source_type",
            native_enum=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=DocumentSourceType.MANUAL,
        server_default=text("'manual'"),
    )
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(
            DocumentStatus,
            name="document_status",
            native_enum=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=DocumentStatus.PROCESSING,
        server_default=text("'processing'"),
    )
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    # `metadata` is a reserved attribute on Base — use doc_metadata internally.
    doc_metadata: Mapped[dict] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=text("TIMEZONE('utc', NOW())"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=text("TIMEZONE('utc', NOW())"),
        onupdate=utc_now,
    )

    chunks: Mapped[list[KnowledgeChunk]] = relationship(  # type: ignore[name-defined]
        "KnowledgeChunk",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="noload",
    )

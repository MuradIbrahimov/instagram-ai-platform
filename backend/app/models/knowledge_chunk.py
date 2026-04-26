from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class KnowledgeChunk(Base, UUIDPrimaryKeyModel):
    __tablename__ = "knowledge_chunks"
    __table_args__ = (
        # workspace_id index already created in M5 migration; declared here so
        # the ORM is aware of it.
        Index("ix_knowledge_chunks_workspace_id", "workspace_id"),
    )

    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"),
        nullable=True,
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_metadata: Mapped[dict] = mapped_column(
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

    document: Mapped[KnowledgeDocument | None] = relationship(  # type: ignore[name-defined]
        "KnowledgeDocument",
        back_populates="chunks",
    )

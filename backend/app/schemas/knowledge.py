from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.knowledge_document import DocumentSourceType, DocumentStatus


class ChunkResponse(BaseModel):
    id: uuid.UUID
    chunk_index: int
    content: str
    token_count: int | None = None


class DocumentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    raw_text: str = Field(min_length=1, max_length=50000)
    source_type: DocumentSourceType = DocumentSourceType.MANUAL

    @field_validator("title", "raw_text", mode="before")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class ChunkResponse(BaseModel):
    id: uuid.UUID
    chunk_index: int
    content: str
    token_count: int | None = None


class DocumentResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    title: str
    source_type: DocumentSourceType
    status: DocumentStatus
    metadata: dict
    raw_text: str
    created_at: datetime
    chunk_count: int = 0
    chunks: list[ChunkResponse] = []


class DocumentListItem(BaseModel):
    id: uuid.UUID
    title: str
    status: DocumentStatus
    source_type: DocumentSourceType
    created_at: datetime
    chunk_count: int = 0

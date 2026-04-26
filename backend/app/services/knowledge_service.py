from __future__ import annotations

import re
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.knowledge_document import DocumentSourceType, DocumentStatus
from app.repositories.knowledge_repo import KnowledgeRepository
from app.schemas.common import PaginatedResponse
from app.schemas.knowledge import ChunkResponse, DocumentCreate, DocumentListItem, DocumentResponse
from app.services.audit_service import log_action


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    """Split *text* into overlapping sentence-boundary chunks.

    Rules:
    - Never split mid-sentence (sentence boundary = '. ' or '.\\n').
    - Chunks grow until they reach *chunk_size* words, then a new chunk is
      started with the last *overlap* words carried over.
    - Trailing chunks shorter than 50 words are merged into the previous chunk
      (unless the document itself is shorter than 50 words, in which case a
      single chunk is returned).
    """
    # Split on sentence boundaries while preserving content
    sentences = re.split(r"(?<=\.)\s+", text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return []

    chunks: list[str] = []
    current_words: list[str] = []

    for sentence in sentences:
        current_words.extend(sentence.split())

        if len(current_words) >= chunk_size:
            chunks.append(" ".join(current_words))
            # Carry the last `overlap` words into the next chunk
            current_words = current_words[-overlap:] if overlap > 0 else []

    # Handle any remaining words
    if current_words:
        remaining = " ".join(current_words)
        if chunks and len(current_words) < 50:
            # Merge short trailing chunk into the previous one
            chunks[-1] = chunks[-1] + " " + remaining
        else:
            chunks.append(remaining)

    return [c for c in chunks if c.strip()]


class KnowledgeService:
    def __init__(self, repo: KnowledgeRepository) -> None:
        self._repo = repo

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _to_response(
        self,
        doc,
        chunk_count: int,
        chunks: list | None = None,
    ) -> DocumentResponse:
        chunk_responses = [
            ChunkResponse(
                id=c.id,
                chunk_index=c.chunk_index,
                content=c.content,
                token_count=c.token_count,
            )
            for c in (chunks or [])
        ]
        return DocumentResponse(
            id=doc.id,
            workspace_id=doc.workspace_id,
            title=doc.title,
            source_type=doc.source_type,
            status=doc.status,
            metadata=doc.doc_metadata,
            raw_text=doc.raw_text,
            created_at=doc.created_at,
            chunk_count=chunk_count,
            chunks=chunk_responses,
        )

    def _to_list_item(self, doc, chunk_count: int) -> DocumentListItem:
        return DocumentListItem(
            id=doc.id,
            title=doc.title,
            status=doc.status,
            source_type=doc.source_type,
            created_at=doc.created_at,
            chunk_count=chunk_count,
        )

    # ── Public API ────────────────────────────────────────────────────────────

    async def create_document(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        payload: DocumentCreate,
    ) -> DocumentResponse:
        doc = await self._repo.create_document(
            db=db,
            workspace_id=workspace_id,
            title=payload.title,
            raw_text=payload.raw_text,
            source_type=payload.source_type,
        )

        try:
            chunk_strings = chunk_text(payload.raw_text)
            chunk_dicts = [
                {
                    "content": content,
                    "chunk_index": idx,
                    "token_count": len(content.split()),
                }
                for idx, content in enumerate(chunk_strings)
            ]
            await self._repo.create_chunks(
                db=db,
                document_id=doc.id,
                workspace_id=workspace_id,
                chunks=chunk_dicts,
            )
            await self._repo.update_document_status(
                db=db, document_id=doc.id, status=DocumentStatus.READY
            )
            doc.status = DocumentStatus.READY
            chunk_count = len(chunk_dicts)
        except Exception:
            await self._repo.update_document_status(
                db=db, document_id=doc.id, status=DocumentStatus.FAILED
            )
            doc.status = DocumentStatus.FAILED
            chunk_count = 0
            raise

        await log_action(
            db=db,
            action="knowledge_document.created",
            target_type="knowledge_document",
            target_id=str(doc.id),
            workspace_id=workspace_id,
            metadata={"chunk_count": chunk_count, "title": payload.title},
        )
        return self._to_response(doc, chunk_count)

    async def get_document(
        self,
        db: AsyncSession,
        document_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> DocumentResponse:
        doc = await self._repo.get_document(
            db=db, document_id=document_id, workspace_id=workspace_id
        )
        if doc is None:
            raise AppException(
                code="document_not_found",
                message="Knowledge document not found",
                status_code=404,
            )
        chunks = await self._repo.get_document_chunks(db=db, document_id=document_id)
        return self._to_response(doc, len(chunks), chunks)

    async def list_documents(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> PaginatedResponse[DocumentListItem]:
        items, total = await self._repo.list_documents(
            db=db,
            workspace_id=workspace_id,
            page=page,
            page_size=page_size,
        )
        return PaginatedResponse(
            items=[self._to_list_item(doc, count) for doc, count in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def delete_document(
        self,
        db: AsyncSession,
        document_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> None:
        deleted = await self._repo.delete_document(
            db=db, document_id=document_id, workspace_id=workspace_id
        )
        if not deleted:
            raise AppException(
                code="document_not_found",
                message="Knowledge document not found",
                status_code=404,
            )
        await log_action(
            db=db,
            action="knowledge_document.deleted",
            target_type="knowledge_document",
            target_id=str(document_id),
            workspace_id=workspace_id,
        )


def get_knowledge_service() -> KnowledgeService:
    return KnowledgeService(repo=KnowledgeRepository())

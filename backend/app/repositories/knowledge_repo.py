from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_chunk import KnowledgeChunk
from app.models.knowledge_document import DocumentSourceType, DocumentStatus, KnowledgeDocument


class KnowledgeRepository:
    # ── Documents ─────────────────────────────────────────────────────────────

    async def create_document(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        title: str,
        raw_text: str,
        source_type: DocumentSourceType,
    ) -> KnowledgeDocument:
        doc = KnowledgeDocument(
            workspace_id=workspace_id,
            title=title,
            raw_text=raw_text,
            source_type=source_type,
            status=DocumentStatus.PROCESSING,
            doc_metadata={},
        )
        db.add(doc)
        await db.flush()
        await db.refresh(doc)
        return doc

    async def update_document_status(
        self,
        db: AsyncSession,
        document_id: uuid.UUID,
        status: DocumentStatus,
    ) -> KnowledgeDocument | None:
        doc = await db.get(KnowledgeDocument, document_id)
        if doc is None:
            return None
        doc.status = status
        await db.flush()
        return doc

    async def get_document(
        self,
        db: AsyncSession,
        document_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> KnowledgeDocument | None:
        result = await db.execute(
            select(KnowledgeDocument).where(
                KnowledgeDocument.id == document_id,
                KnowledgeDocument.workspace_id == workspace_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_document_chunk_count(
        self,
        db: AsyncSession,
        document_id: uuid.UUID,
    ) -> int:
        result = await db.execute(
            select(func.count()).where(KnowledgeChunk.document_id == document_id)
        )
        return result.scalar_one()

    async def list_documents(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[tuple[KnowledgeDocument, int]], int]:
        """Return (list of (document, chunk_count) tuples, total count)."""
        chunk_count_subq = (
            select(
                KnowledgeChunk.document_id,
                func.count(KnowledgeChunk.id).label("chunk_count"),
            )
            .where(KnowledgeChunk.document_id.isnot(None))
            .group_by(KnowledgeChunk.document_id)
            .subquery()
        )

        base_query = select(
            KnowledgeDocument,
            func.coalesce(chunk_count_subq.c.chunk_count, 0).label("chunk_count"),
        ).outerjoin(
            chunk_count_subq,
            KnowledgeDocument.id == chunk_count_subq.c.document_id,
        ).where(
            KnowledgeDocument.workspace_id == workspace_id,
        )

        total_result = await db.execute(
            select(func.count()).select_from(
                select(KnowledgeDocument.id)
                .where(KnowledgeDocument.workspace_id == workspace_id)
                .subquery()
            )
        )
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        rows = await db.execute(
            base_query.order_by(KnowledgeDocument.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        items = [(row.KnowledgeDocument, row.chunk_count) for row in rows]
        return items, total

    async def delete_document(
        self,
        db: AsyncSession,
        document_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> bool:
        """Delete document after verifying workspace ownership. Returns True if deleted."""
        doc = await self.get_document(db=db, document_id=document_id, workspace_id=workspace_id)
        if doc is None:
            return False
        await db.delete(doc)
        await db.flush()
        return True

    async def get_document_chunks(
        self,
        db: AsyncSession,
        document_id: uuid.UUID,
    ) -> list[KnowledgeChunk]:
        result = await db.execute(
            select(KnowledgeChunk)
            .where(KnowledgeChunk.document_id == document_id)
            .order_by(KnowledgeChunk.chunk_index)
        )
        return list(result.scalars().all())

    async def workspace_has_documents(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
    ) -> bool:
        result = await db.execute(
            select(func.count())
            .select_from(KnowledgeDocument)
            .where(
                KnowledgeDocument.workspace_id == workspace_id,
                KnowledgeDocument.status == DocumentStatus.READY,
            )
        )
        return result.scalar_one() > 0

    # ── Chunks ────────────────────────────────────────────────────────────────

    async def create_chunks(
        self,
        db: AsyncSession,
        document_id: uuid.UUID,
        workspace_id: uuid.UUID,
        chunks: list[dict[str, Any]],
    ) -> None:
        """Bulk insert chunks. Each dict must have content, chunk_index, token_count."""
        if not chunks:
            return
        objects = [
            KnowledgeChunk(
                document_id=document_id,
                workspace_id=workspace_id,
                content=c["content"],
                chunk_index=c["chunk_index"],
                token_count=c.get("token_count"),
                chunk_metadata={},
            )
            for c in chunks
        ]
        db.add_all(objects)
        await db.flush()

    async def search_chunks(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        query: str,
        top_k: int = 5,
    ) -> list[str]:
        """Full-text search over chunks for a workspace.

        Returns a list of content strings ranked by ts_rank.
        """
        result = await db.execute(
            text(
                """
                SELECT content
                FROM   knowledge_chunks
                WHERE  workspace_id = :workspace_id
                  AND  to_tsvector('english', content) @@ plainto_tsquery('english', :query)
                ORDER BY ts_rank(
                    to_tsvector('english', content),
                    plainto_tsquery('english', :query)
                ) DESC
                LIMIT :top_k
                """
            ),
            {
                "workspace_id": str(workspace_id),
                "query": query,
                "top_k": top_k,
            },
        )
        rows = result.fetchall()
        return [row[0] for row in rows]

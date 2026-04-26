"""Keyword-based knowledge retrieval using PostgreSQL full-text search.

MVP implementation: uses tsvector / tsquery ranking — no vector embeddings.
Vector search (pgvector) is planned for v2.

Never raises — always returns an empty list on any error or when the
knowledge base is empty. The AI pipeline handles an empty chunk list gracefully.
"""
from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.repositories.knowledge_repo import KnowledgeRepository

logger = get_logger(__name__)

_repo = KnowledgeRepository()


async def retrieve_relevant_chunks(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    query_text: str,
    top_k: int = 5,
) -> list[str]:
    """Return up to top_k text chunks relevant to query_text.

    Returns an empty list when the workspace has no documents, the query
    yields no results, or any error occurs.
    """
    if not query_text or not query_text.strip():
        return []

    try:
        # Short-circuit if the workspace has no ready documents at all —
        # avoids an expensive FTS query against an empty table.
        has_docs = await _repo.workspace_has_documents(db=db, workspace_id=workspace_id)
        if not has_docs:
            return []

        return await _repo.search_chunks(
            db=db,
            workspace_id=workspace_id,
            query=query_text.strip(),
            top_k=top_k,
        )
    except Exception:
        logger.warning(
            "retrieval_failed",
            workspace_id=str(workspace_id),
            query_length=len(query_text),
        )
        return []


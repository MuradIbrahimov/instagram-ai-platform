"""Tests for the knowledge base endpoints and service."""
from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.knowledge_service import KnowledgeService, chunk_text


# ── chunk_text unit tests ─────────────────────────────────────────────────────
class TestChunkText:
    def test_short_text_returns_single_chunk(self) -> None:
        chunks = chunk_text("Hello world.", chunk_size=400, overlap=50)
        assert len(chunks) == 1
        assert chunks[0].strip() != ""

    def test_empty_string_returns_empty(self) -> None:
        chunks = chunk_text("", chunk_size=400, overlap=50)
        assert chunks == []

    def test_long_text_produces_multiple_chunks(self) -> None:
        # ~600-word text
        long_text = ". ".join(["word"] * 600) + "."
        chunks = chunk_text(long_text, chunk_size=400, overlap=50)
        assert len(chunks) > 1


# ── Knowledge document API tests ─────────────────────────────────────────────
class TestKnowledgeDocuments:
    async def test_create_document_success(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        resp = await async_client.post(
            f"/api/v1/workspaces/{test_workspace['id']}/knowledge/documents",
            json={
                "title": "FAQ",
                "raw_text": "Q: What is your return policy? A: 30-day returns.",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "FAQ"
        assert data["status"] in {"ready", "failed"}

    async def test_create_document_creates_chunks(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        resp = await async_client.post(
            f"/api/v1/workspaces/{test_workspace['id']}/knowledge/documents",
            json={
                "title": "Long Doc",
                "raw_text": "This is a sentence. " * 200,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["chunk_count"] > 0

    async def test_create_document_validates_max_length(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        resp = await async_client.post(
            f"/api/v1/workspaces/{test_workspace['id']}/knowledge/documents",
            json={"title": "Too Long", "raw_text": "x" * 50001},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    async def test_list_documents(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        # Create one document first
        await async_client.post(
            f"/api/v1/workspaces/{test_workspace['id']}/knowledge/documents",
            json={"title": "List Test", "raw_text": "Content."},
            headers=auth_headers,
        )
        resp = await async_client.get(
            f"/api/v1/workspaces/{test_workspace['id']}/knowledge/documents",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    async def test_get_document(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        create_resp = await async_client.post(
            f"/api/v1/workspaces/{test_workspace['id']}/knowledge/documents",
            json={"title": "Get Test", "raw_text": "Content."},
            headers=auth_headers,
        )
        assert create_resp.status_code == 201
        doc_id = create_resp.json()["id"]

        get_resp = await async_client.get(
            f"/api/v1/workspaces/{test_workspace['id']}/knowledge/documents/{doc_id}",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == doc_id

    async def test_delete_document_owner(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        create_resp = await async_client.post(
            f"/api/v1/workspaces/{test_workspace['id']}/knowledge/documents",
            json={"title": "Delete Test", "raw_text": "Content."},
            headers=auth_headers,
        )
        doc_id = create_resp.json()["id"]

        del_resp = await async_client.delete(
            f"/api/v1/workspaces/{test_workspace['id']}/knowledge/documents/{doc_id}",
            headers=auth_headers,
        )
        assert del_resp.status_code == 204

    async def test_delete_document_wrong_workspace(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        resp = await async_client.delete(
            f"/api/v1/workspaces/{uuid.uuid4()}/knowledge/documents/{uuid.uuid4()}",
            headers=auth_headers,
        )
        assert resp.status_code in {403, 404}

    async def test_create_unauthenticated(
        self,
        async_client: AsyncClient,
        test_workspace: dict,
    ) -> None:
        resp = await async_client.post(
            f"/api/v1/workspaces/{test_workspace['id']}/knowledge/documents",
            json={"title": "Anon", "raw_text": "Content."},
        )
        assert resp.status_code == 401

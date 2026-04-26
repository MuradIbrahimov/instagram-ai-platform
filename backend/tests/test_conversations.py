"""Tests for conversation endpoints."""
from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import sample_meta_webhook_payload


# ── Helper to create a conversation via a webhook event ─────────────────────
async def _seed_conversation(
    async_client: AsyncClient,
    auth_headers: dict,
    workspace_id: str,
    ig_account: dict,
    sender_id: str,
) -> str:
    """Insert a conversation by simulating an inbound webhook from the given sender."""
    import hashlib
    import hmac
    import json
    import os

    payload = sample_meta_webhook_payload(
        sender_id=sender_id,
        recipient_id=ig_account["ig_user_id"],
        message_text="Hello",
    )
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode()
    secret = os.environ["META_APP_SECRET"]
    sig = "sha256=" + hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()

    with patch("app.tasks.webhook_tasks.process_webhook_event.delay"):
        resp = await async_client.post(
            "/api/v1/webhooks/meta",
            content=payload_bytes,
            headers={"Content-Type": "application/json", "x-hub-signature-256": sig},
        )
    assert resp.status_code == 200

    # Fetch first conversation
    conv_resp = await async_client.get(
        f"/api/v1/workspaces/{workspace_id}/conversations",
        headers=auth_headers,
    )
    assert conv_resp.status_code == 200
    convs = conv_resp.json()
    assert len(convs) > 0
    return convs[0]["id"]


class TestListConversations:
    async def test_list_empty(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        resp = await async_client.get(
            f"/api/v1/workspaces/{test_workspace['id']}/conversations",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_cross_workspace_forbidden(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ) -> None:
        resp = await async_client.get(
            f"/api/v1/workspaces/{uuid.uuid4()}/conversations",
            headers=auth_headers,
        )
        assert resp.status_code in {403, 404}

    async def test_unauthenticated(
        self, async_client: AsyncClient, test_workspace: dict
    ) -> None:
        resp = await async_client.get(
            f"/api/v1/workspaces/{test_workspace['id']}/conversations"
        )
        assert resp.status_code == 401


class TestPauseResumeAI:
    async def test_pause_ai_nonexistent(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        resp = await async_client.post(
            f"/api/v1/workspaces/{test_workspace['id']}/conversations/{uuid.uuid4()}/pause-ai",
            headers=auth_headers,
        )
        assert resp.status_code == 404

    async def test_resume_ai_nonexistent(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        resp = await async_client.post(
            f"/api/v1/workspaces/{test_workspace['id']}/conversations/{uuid.uuid4()}/resume-ai",
            headers=auth_headers,
        )
        assert resp.status_code == 404


class TestAssignConversation:
    async def test_assign_nonexistent(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
        test_user: dict,
    ) -> None:
        resp = await async_client.post(
            f"/api/v1/workspaces/{test_workspace['id']}/conversations/{uuid.uuid4()}/assign",
            json={"user_id": test_user["id"]},
            headers=auth_headers,
        )
        assert resp.status_code == 404

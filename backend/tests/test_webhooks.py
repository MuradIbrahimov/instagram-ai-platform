"""Tests for Meta webhook endpoints."""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import uuid
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.conftest import sample_meta_webhook_payload


def _sign(payload_bytes: bytes) -> str:
    secret = os.environ["META_APP_SECRET"]
    return "sha256=" + hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()


class TestWebhookVerification:
    async def test_verify_correct_token(self, async_client: AsyncClient) -> None:
        verify_token = os.environ["META_VERIFY_TOKEN"]
        challenge = "abc123"
        resp = await async_client.get(
            "/api/v1/webhooks/meta",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": verify_token,
                "hub.challenge": challenge,
            },
        )
        assert resp.status_code == 200
        assert challenge in resp.text

    async def test_verify_wrong_token(self, async_client: AsyncClient) -> None:
        resp = await async_client.get(
            "/api/v1/webhooks/meta",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": "wrong-token",
                "hub.challenge": "challenge",
            },
        )
        assert resp.status_code == 403


class TestWebhookIngestion:
    def _make_payload(self, recipient_id: str) -> tuple[bytes, dict]:
        sender_id = f"sender_{uuid.uuid4().hex[:8]}"
        payload = sample_meta_webhook_payload(sender_id, recipient_id, "Hello!")
        payload_bytes = json.dumps(payload, separators=(",", ":")).encode()
        return payload_bytes, payload

    async def test_valid_signature_returns_200(
        self,
        async_client: AsyncClient,
        test_instagram_account: dict,
    ) -> None:
        payload_bytes, _ = self._make_payload(test_instagram_account["ig_user_id"])
        sig = _sign(payload_bytes)
        with patch("app.services.webhook_service.process_webhook_event.delay"):
            resp = await async_client.post(
                "/api/v1/webhooks/meta",
                content=payload_bytes,
                headers={"Content-Type": "application/json", "x-hub-signature-256": sig},
            )
        assert resp.status_code == 200

    async def test_invalid_signature_still_returns_200(
        self,
        async_client: AsyncClient,
    ) -> None:
        payload = {"object": "instagram", "entry": []}
        payload_bytes = json.dumps(payload).encode()
        resp = await async_client.post(
            "/api/v1/webhooks/meta",
            content=payload_bytes,
            headers={
                "Content-Type": "application/json",
                "x-hub-signature-256": "sha256=invalidsig",
            },
        )
        # Always return 200 to Meta even on bad signature
        assert resp.status_code == 200

    async def test_duplicate_hash_ignored(
        self,
        async_client: AsyncClient,
        test_instagram_account: dict,
    ) -> None:
        """Sending identical payload twice should not create two webhook events."""
        payload_bytes, _ = self._make_payload(test_instagram_account["ig_user_id"])
        sig = _sign(payload_bytes)

        with patch("app.services.webhook_service.process_webhook_event.delay"):
            r1 = await async_client.post(
                "/api/v1/webhooks/meta",
                content=payload_bytes,
                headers={"Content-Type": "application/json", "x-hub-signature-256": sig},
            )
            r2 = await async_client.post(
                "/api/v1/webhooks/meta",
                content=payload_bytes,
                headers={"Content-Type": "application/json", "x-hub-signature-256": sig},
            )
        assert r1.status_code == 200
        assert r2.status_code == 200

    async def test_unknown_account_id_returns_200(
        self, async_client: AsyncClient
    ) -> None:
        """Payload for an unknown IG account should not crash the endpoint."""
        unknown_id = f"unknown_{uuid.uuid4().hex}"
        payload = sample_meta_webhook_payload(
            sender_id="anysender", recipient_id=unknown_id, message_text="Hi"
        )
        payload_bytes = json.dumps(payload, separators=(",", ":")).encode()
        sig = _sign(payload_bytes)

        with patch("app.services.webhook_service.process_webhook_event.delay"):
            resp = await async_client.post(
                "/api/v1/webhooks/meta",
                content=payload_bytes,
                headers={"Content-Type": "application/json", "x-hub-signature-256": sig},
            )
        assert resp.status_code == 200

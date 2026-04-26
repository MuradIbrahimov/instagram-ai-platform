"""Tests for authentication endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta

import pytest
from httpx import AsyncClient
from jose import jwt


# ── Register ─────────────────────────────────────────────────────────────────
class TestRegister:
    async def test_register_success(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": f"new-{uuid.uuid4().hex[:8]}@example.com",
                "password": "SecurePass1",
                "full_name": "New User",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert data["is_active"] is True

    async def test_register_duplicate_email(self, async_client: AsyncClient, test_user: dict) -> None:
        resp = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user["email"],
                "password": "Password123",
                "full_name": "Dup User",
            },
        )
        assert resp.status_code == 409

    async def test_register_invalid_email(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/register",
            json={"email": "not-an-email", "password": "Password123", "full_name": "Bad"},
        )
        assert resp.status_code == 422

    async def test_register_short_password(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": f"short-{uuid.uuid4().hex[:8]}@example.com",
                "password": "abc",
                "full_name": "Short",
            },
        )
        assert resp.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────
class TestLogin:
    async def test_login_success(self, async_client: AsyncClient, test_user: dict) -> None:
        resp = await async_client.post(
            "/api/v1/auth/login",
            json={"email": test_user["email"], "password": "Password123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, async_client: AsyncClient, test_user: dict) -> None:
        resp = await async_client.post(
            "/api/v1/auth/login",
            json={"email": test_user["email"], "password": "WrongPass999"},
        )
        assert resp.status_code == 401

    async def test_login_unknown_email(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@nowhere.com", "password": "Whatever1"},
        )
        assert resp.status_code == 401


# ── GET /auth/me ──────────────────────────────────────────────────────────────
class TestMe:
    async def test_me_authenticated(
        self, async_client: AsyncClient, test_user: dict, auth_headers: dict
    ) -> None:
        resp = await async_client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == test_user["email"]

    async def test_me_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    async def test_me_expired_token(self, async_client: AsyncClient) -> None:
        from app.core.config import get_settings

        settings = get_settings()
        expired_token = jwt.encode(
            {
                "sub": str(uuid.uuid4()),
                "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
            },
            settings.secret_key,
            algorithm="HS256",
        )
        resp = await async_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert resp.status_code == 401

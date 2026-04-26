"""Tests for workspace endpoints."""
from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


class TestCreateWorkspace:
    async def test_create_success(
        self, async_client: AsyncClient, auth_headers: dict
    ) -> None:
        resp = await async_client.post(
            "/api/v1/workspaces",
            json={"name": f"WS {uuid.uuid4().hex[:6]}"},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert "slug" in data

    async def test_create_with_explicit_slug(
        self, async_client: AsyncClient, auth_headers: dict
    ) -> None:
        slug = f"my-slug-{uuid.uuid4().hex[:6]}"
        resp = await async_client.post(
            "/api/v1/workspaces",
            json={"name": "Named Workspace", "slug": slug},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["slug"] == slug

    async def test_duplicate_slug_autogenerates_new(
        self, async_client: AsyncClient, auth_headers: dict
    ) -> None:
        slug = f"unique-{uuid.uuid4().hex[:8]}"
        r1 = await async_client.post(
            "/api/v1/workspaces",
            json={"name": "First", "slug": slug},
            headers=auth_headers,
        )
        assert r1.status_code == 201

        # Second request with same slug — app auto-generates a new one
        r2 = await async_client.post(
            "/api/v1/workspaces",
            json={"name": "Second", "slug": slug},
            headers=auth_headers,
        )
        assert r2.status_code == 201
        assert r2.json()["slug"] != slug  # auto-uniquified

    async def test_create_invalid_slug_pattern(
        self, async_client: AsyncClient, auth_headers: dict
    ) -> None:
        resp = await async_client.post(
            "/api/v1/workspaces",
            json={"name": "Bad Slug", "slug": "UPPERCASE_SLUG!"},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    async def test_create_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/workspaces",
            json={"name": "Anon"},
        )
        assert resp.status_code == 401


class TestListWorkspaces:
    async def test_list_only_own_workspaces(
        self, async_client: AsyncClient, auth_headers: dict, test_workspace: dict
    ) -> None:
        resp = await async_client.get("/api/v1/workspaces", headers=auth_headers)
        assert resp.status_code == 200
        ids = [ws["id"] for ws in resp.json()]
        assert test_workspace["id"] in ids

    async def test_list_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.get("/api/v1/workspaces")
        assert resp.status_code == 401


class TestGetWorkspace:
    async def test_get_member_workspace(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_workspace: dict,
    ) -> None:
        resp = await async_client.get(
            f"/api/v1/workspaces/{test_workspace['id']}",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == test_workspace["id"]

    async def test_get_non_member_workspace(
        self, async_client: AsyncClient, auth_headers: dict
    ) -> None:
        # Random UUID that does not belong to this user
        resp = await async_client.get(
            f"/api/v1/workspaces/{uuid.uuid4()}",
            headers=auth_headers,
        )
        assert resp.status_code in {403, 404}

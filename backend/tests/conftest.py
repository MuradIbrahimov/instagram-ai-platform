"""Test configuration and shared fixtures.

Uses a transaction-rollback strategy for test isolation:
  - Session-scoped engine creates all tables once per session.
  - Function-scoped db_session wraps each test in a SAVEPOINT and rolls
    back to it after the test, preserving the outer connection for the
    next test.
"""
from __future__ import annotations

import os
import uuid

# ── Set env vars BEFORE any app import ──────────────────────────────────────
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("SECRET_KEY", "testsecretkey1234567890abcdefghjk")
os.environ.setdefault("ENCRYPTION_KEY", "testencryptionkey1234567890abcde")
os.environ.setdefault("POSTGRES_HOST", "localhost")
os.environ.setdefault("POSTGRES_PORT", "5433")
os.environ.setdefault("POSTGRES_DB", "ig_ai_test")
os.environ.setdefault("POSTGRES_USER", "postgres")
os.environ.setdefault("POSTGRES_PASSWORD", "postgres")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("CELERY_BROKER_URL", "redis://localhost:6379/0")
os.environ.setdefault("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")
os.environ.setdefault("META_APP_ID", "test_app_id")
os.environ.setdefault("META_APP_SECRET", "test_app_secret")
os.environ.setdefault("META_VERIFY_TOKEN", "test_verify_token")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")

# ── Now it is safe to import app code ───────────────────────────────────────
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.database import Base, get_db
from app.main import create_app

TEST_DB_URL = (
    f"postgresql+asyncpg://"
    f"{os.environ['POSTGRES_USER']}:{os.environ['POSTGRES_PASSWORD']}"
    f"@{os.environ['POSTGRES_HOST']}:{os.environ['POSTGRES_PORT']}"
    f"/{os.environ['POSTGRES_DB']}"
)

# ── Import all models so they register with Base.metadata ───────────────────
import app.models  # noqa: F401 – side-effect: registers all ORM models


# ── Session-scoped engine / table setup ─────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def test_engine() -> AsyncEngine:  # type: ignore[return]
    engine = create_async_engine(TEST_DB_URL, echo=False, pool_pre_ping=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


# ── Function-scoped DB session with savepoint rollback ──────────────────────
@pytest_asyncio.fixture
async def db_session(test_engine: AsyncEngine) -> AsyncSession:  # type: ignore[return]
    TestSession = async_sessionmaker(
        bind=test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with TestSession() as session:
        async with session.begin():
            # Create a savepoint so we can roll back per-test
            await session.begin_nested()

            # When the ORM issues commit(), restart the savepoint instead
            # so the outer transaction stays open.
            from sqlalchemy import event

            @event.listens_for(session.sync_session, "after_transaction_end")
            def restart_savepoint(session_inner, transaction):
                if transaction.nested and not transaction._parent.nested:
                    session_inner.begin_nested()

            yield session
            await session.rollback()


# ── ASGI test client ─────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncClient:  # type: ignore[return]
    app = create_app()

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()


# ── Auth fixtures ────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def test_user(async_client: AsyncClient) -> dict:
    resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": f"user-{uuid.uuid4().hex[:8]}@example.com",
            "password": "Password123",
            "full_name": "Test User",
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest_asyncio.fixture
async def test_token(async_client: AsyncClient, test_user: dict) -> str:
    resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": test_user["email"], "password": "Password123"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def auth_headers(test_token: str) -> dict:
    return {"Authorization": f"Bearer {test_token}"}


# ── Workspace fixture ────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def test_workspace(async_client: AsyncClient, auth_headers: dict) -> dict:
    resp = await async_client.post(
        "/api/v1/workspaces",
        json={"name": f"workspace-{uuid.uuid4().hex[:6]}"},
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ── Instagram account fixture ────────────────────────────────────────────────
@pytest_asyncio.fixture
async def test_instagram_account(
    async_client: AsyncClient, auth_headers: dict, test_workspace: dict
) -> dict:
    resp = await async_client.post(
        f"/api/v1/workspaces/{test_workspace['id']}/instagram/accounts",
        json={
            "ig_user_id": f"ig_{uuid.uuid4().hex[:8]}",
            "ig_username": f"testuser_{uuid.uuid4().hex[:6]}",
            "access_token": "test_access_token",
            "page_id": f"page_{uuid.uuid4().hex[:8]}",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ── Webhook payload factory ──────────────────────────────────────────────────
def sample_meta_webhook_payload(
    sender_id: str, recipient_id: str, message_text: str
) -> dict:
    return {
        "object": "instagram",
        "entry": [
            {
                "id": recipient_id,
                "messaging": [
                    {
                        "sender": {"id": sender_id},
                        "recipient": {"id": recipient_id},
                        "timestamp": 1700000000000,
                        "message": {
                            "mid": f"mid_{uuid.uuid4().hex}",
                            "text": message_text,
                        },
                    }
                ],
            }
        ],
    }

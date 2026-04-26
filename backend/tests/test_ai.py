"""Tests for the AI reply pipeline (mocked LLM)."""
from __future__ import annotations

import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_run import AiDecision, AiRunStatus
from app.models.conversation import ConversationStatus
from app.models.instagram_account import ReplyMode
from app.models.message import MessageStatus
from app.services.ai_service import AiService


# ── Helper fixtures ──────────────────────────────────────────────────────────
def _llm_response(reply_text: str, confidence: float, should_escalate: bool) -> dict:
    return {
        "text": json.dumps(
            {
                "reply_text": reply_text,
                "confidence": confidence,
                "should_escalate": should_escalate,
            }
        ),
        "input_tokens": 100,
        "output_tokens": 50,
    }


def _bad_llm_response() -> dict:
    return {"text": "not valid json {{", "input_tokens": 10, "output_tokens": 5}


@pytest_asyncio.fixture
async def seeded_conversation(
    db_session: AsyncSession,
    test_workspace: dict,
    test_instagram_account: dict,
) -> dict:
    """Create a minimal conversation row directly in the DB."""
    from app.models.conversation import Conversation, ConversationStatus

    ws_id = uuid.UUID(test_workspace["id"])
    acct_id = uuid.UUID(test_instagram_account["id"])

    conv = Conversation(
        workspace_id=ws_id,
        instagram_account_id=acct_id,
        external_conversation_id=f"ext_{uuid.uuid4().hex}",
        participant_ig_user_id=f"user_{uuid.uuid4().hex[:8]}",
        status=ConversationStatus.OPEN,
    )
    db_session.add(conv)
    await db_session.flush()
    return {
        "id": str(conv.id),
        "workspace_id": str(ws_id),
        "instagram_account_id": str(acct_id),
    }


@pytest_asyncio.fixture
async def seeded_trigger_message(
    db_session: AsyncSession,
    seeded_conversation: dict,
    test_instagram_account: dict,
) -> str:
    """Create an inbound message to trigger AI on."""
    from app.models.message import Message, MessageDirection, MessageStatus, MessageType, SenderType

    msg = Message(
        conversation_id=uuid.UUID(seeded_conversation["id"]),
        workspace_id=uuid.UUID(seeded_conversation["workspace_id"]),
        instagram_account_id=uuid.UUID(seeded_conversation["instagram_account_id"]),
        sender_type=SenderType.HUMAN,
        direction=MessageDirection.INBOUND,
        message_type=MessageType.TEXT,
        text_content="I need help with my order",
        status=MessageStatus.DELIVERED,
        external_message_id=f"mid_{uuid.uuid4().hex}",
    )
    db_session.add(msg)
    await db_session.flush()
    return str(msg.id)


# ── AI pipeline tests ────────────────────────────────────────────────────────
class TestAiPipeline:
    async def test_low_confidence_escalates(
        self,
        db_session: AsyncSession,
        seeded_conversation: dict,
        seeded_trigger_message: str,
    ) -> None:
        svc = AiService()
        ws_id = uuid.UUID(seeded_conversation["workspace_id"])
        conv_id = uuid.UUID(seeded_conversation["id"])
        trigger_id = uuid.UUID(seeded_trigger_message)

        # Override account threshold — set high so low confidence fires
        from app.models.instagram_account import InstagramAccount
        acct = await db_session.get(
            InstagramAccount, uuid.UUID(seeded_conversation["instagram_account_id"])
        )
        assert acct is not None
        acct.confidence_threshold = 0.9
        acct.reply_mode = ReplyMode.AUTOMATIC
        await db_session.flush()

        with patch.object(
            svc._llm_client,
            "chat_completion",
            new=AsyncMock(return_value=_llm_response("ok", confidence=0.3, should_escalate=False)),
        ), patch("app.services.ai_service.send_outbound_message") as mock_delay:
            run = await svc.generate_reply(
                db=db_session,
                conversation_id=conv_id,
                trigger_message_id=trigger_id,
                workspace_id=ws_id,
            )

        assert run.status == AiRunStatus.COMPLETED
        assert run.decision == AiDecision.ESCALATED
        mock_delay.delay.assert_not_called()

        from sqlalchemy import select
        from app.models.conversation import Conversation
        row = await db_session.get(Conversation, conv_id)
        assert row is not None
        assert row.status == ConversationStatus.HANDOFF

    async def test_should_escalate_flag_escalates(
        self,
        db_session: AsyncSession,
        seeded_conversation: dict,
        seeded_trigger_message: str,
    ) -> None:
        svc = AiService()
        ws_id = uuid.UUID(seeded_conversation["workspace_id"])
        conv_id = uuid.UUID(seeded_conversation["id"])
        trigger_id = uuid.UUID(seeded_trigger_message)

        with patch.object(
            svc._llm_client,
            "chat_completion",
            new=AsyncMock(return_value=_llm_response("ok", confidence=0.95, should_escalate=True)),
        ), patch("app.services.ai_service.send_outbound_message"):
            run = await svc.generate_reply(
                db=db_session,
                conversation_id=conv_id,
                trigger_message_id=trigger_id,
                workspace_id=ws_id,
            )

        assert run.decision == AiDecision.ESCALATED

    async def test_automatic_mode_enqueues_delivery(
        self,
        db_session: AsyncSession,
        seeded_conversation: dict,
        seeded_trigger_message: str,
    ) -> None:
        from app.models.instagram_account import InstagramAccount

        svc = AiService()
        ws_id = uuid.UUID(seeded_conversation["workspace_id"])
        conv_id = uuid.UUID(seeded_conversation["id"])
        trigger_id = uuid.UUID(seeded_trigger_message)

        acct = await db_session.get(
            InstagramAccount, uuid.UUID(seeded_conversation["instagram_account_id"])
        )
        assert acct is not None
        acct.confidence_threshold = 0.5
        acct.reply_mode = ReplyMode.AUTOMATIC
        await db_session.flush()

        mock_task = MagicMock()
        with patch.object(
            svc._llm_client,
            "chat_completion",
            new=AsyncMock(return_value=_llm_response("Hello!", confidence=0.9, should_escalate=False)),
        ), patch("app.services.ai_service.send_outbound_message", mock_task):
            run = await svc.generate_reply(
                db=db_session,
                conversation_id=conv_id,
                trigger_message_id=trigger_id,
                workspace_id=ws_id,
            )

        assert run.status == AiRunStatus.COMPLETED
        assert run.decision == AiDecision.REPLIED
        mock_task.delay.assert_called_once()

    async def test_approval_required_no_delivery(
        self,
        db_session: AsyncSession,
        seeded_conversation: dict,
        seeded_trigger_message: str,
    ) -> None:
        from app.models.instagram_account import InstagramAccount

        svc = AiService()
        ws_id = uuid.UUID(seeded_conversation["workspace_id"])
        conv_id = uuid.UUID(seeded_conversation["id"])
        trigger_id = uuid.UUID(seeded_trigger_message)

        acct = await db_session.get(
            InstagramAccount, uuid.UUID(seeded_conversation["instagram_account_id"])
        )
        assert acct is not None
        acct.confidence_threshold = 0.5
        acct.reply_mode = ReplyMode.APPROVAL_REQUIRED
        await db_session.flush()

        mock_task = MagicMock()
        with patch.object(
            svc._llm_client,
            "chat_completion",
            new=AsyncMock(return_value=_llm_response("Hi!", confidence=0.9, should_escalate=False)),
        ), patch("app.services.ai_service.send_outbound_message", mock_task):
            run = await svc.generate_reply(
                db=db_session,
                conversation_id=conv_id,
                trigger_message_id=trigger_id,
                workspace_id=ws_id,
            )

        assert run.decision == AiDecision.REPLIED
        mock_task.delay.assert_not_called()

        # The outbound message should be QUEUED, not SENT
        from sqlalchemy import select
        from app.models.message import Message, MessageStatus, MessageDirection
        result = await db_session.execute(
            select(Message).where(
                Message.conversation_id == conv_id,
                Message.direction == MessageDirection.OUTBOUND,
            )
        )
        msg = result.scalars().first()
        assert msg is not None
        assert msg.status == MessageStatus.QUEUED

    async def test_invalid_json_marks_run_failed(
        self,
        db_session: AsyncSession,
        seeded_conversation: dict,
        seeded_trigger_message: str,
    ) -> None:
        svc = AiService()
        ws_id = uuid.UUID(seeded_conversation["workspace_id"])
        conv_id = uuid.UUID(seeded_conversation["id"])
        trigger_id = uuid.UUID(seeded_trigger_message)

        with patch.object(
            svc._llm_client,
            "chat_completion",
            new=AsyncMock(return_value=_bad_llm_response()),
        ), patch("app.services.ai_service.send_outbound_message"):
            run = await svc.generate_reply(
                db=db_session,
                conversation_id=conv_id,
                trigger_message_id=trigger_id,
                workspace_id=ws_id,
            )

        assert run.status == AiRunStatus.FAILED
        assert run.failure_reason == "invalid_json_response"

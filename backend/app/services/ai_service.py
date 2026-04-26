"""AI reply generation pipeline.

Every execution:
  - Creates an ai_run record
  - Calls the LLM
  - Parses output
  - Decides: escalate | draft (approval_required) | send (automatic)
  - Always leaves ai_run in a terminal state (completed / failed)
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.integrations.llm.client import get_llm_client
from app.integrations.llm.prompts import (
    SYSTEM_PROMPT_VERSION,
    build_conversation_messages,
    build_system_prompt,
)
from app.integrations.llm.retrieval import retrieve_relevant_chunks
from app.models.ai_run import AiDecision, AiRun, AiRunStatus
from app.models.conversation import Conversation, ConversationStatus
from app.models.instagram_account import InstagramAccount, ReplyMode
from app.models.message import Message, MessageDirection, MessageStatus, MessageType, SenderType
from app.models.workspace import Workspace
from app.repositories.ai_repo import AiRunRepository
from app.repositories.message_repo import MessageRepository
from app.services.audit_service import log_action
from app.tasks.delivery_tasks import send_outbound_message

logger = get_logger(__name__)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AiService:
    def __init__(self) -> None:
        self._ai_repo = AiRunRepository()
        self._message_repo = MessageRepository()
        self._llm_client = get_llm_client()

    async def generate_reply(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        trigger_message_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> AiRun:
        """Run the full AI reply pipeline.

        Always returns an AiRun in a terminal state (completed or failed).
        Never raises — all exceptions are caught, stored in ai_run.failure_reason,
        and then re-raised so the Celery task can decide whether to retry.
        """
        settings = get_settings()
        run: AiRun | None = None

        try:
            # ── a. Load conversation ──────────────────────────────────────────
            conversation = await db.get(Conversation, conversation_id)
            if conversation is None:
                raise ValueError(f"Conversation {conversation_id} not found")

            # ── b. Load instagram account settings ───────────────────────────
            account = await db.get(InstagramAccount, conversation.instagram_account_id)
            if account is None:
                raise ValueError(
                    f"InstagramAccount {conversation.instagram_account_id} not found"
                )

            workspace = await db.get(Workspace, workspace_id)
            workspace_name = workspace.name if workspace else "our team"

            confidence_threshold: float = account.confidence_threshold
            reply_mode: ReplyMode = account.reply_mode

            # ── c. Retrieve knowledge chunks ──────────────────────────────────
            # Use the last inbound message text as the retrieval query
            recent_messages = await self._message_repo.get_recent(
                db=db,
                conversation_id=conversation_id,
                workspace_id=workspace_id,
                limit=10,
            )

            # Find the trigger message to use as retrieval query
            query_text = ""
            for msg in reversed(recent_messages):
                if (
                    str(msg.id) == str(trigger_message_id)
                    or msg.direction == MessageDirection.INBOUND
                ):
                    query_text = msg.text_content or ""
                    break

            knowledge_chunks = await retrieve_relevant_chunks(
                db=db,
                workspace_id=workspace_id,
                query_text=query_text,
                top_k=5,
            )

            # ── d-e. Build prompts ────────────────────────────────────────────
            system_prompt = build_system_prompt(
                workspace_name=workspace_name,
                knowledge_chunks=knowledge_chunks,
            )
            conversation_messages = build_conversation_messages(recent_messages)

            # ── f. Create ai_run ──────────────────────────────────────────────
            run = await self._ai_repo.create_run(
                db=db,
                workspace_id=workspace_id,
                conversation_id=conversation_id,
                trigger_message_id=trigger_message_id,
                model_name=settings.openai_model,
                system_prompt_version=SYSTEM_PROMPT_VERSION,
            )
            run = await self._ai_repo.update_run(
                db=db,
                run_id=run.id,
                status=AiRunStatus.RUNNING,
            )
            await db.commit()

            logger.info(
                "ai_run_started",
                run_id=str(run.id),
                conversation_id=str(conversation_id),
                model=settings.openai_model,
            )

            # ── g. Call LLM ───────────────────────────────────────────────────
            llm_result = await self._llm_client.chat_completion(
                system_prompt=system_prompt,
                messages=conversation_messages,
                model=settings.openai_model,
            )

            raw_text: str = str(llm_result["text"])
            input_tokens: int = int(llm_result["input_tokens"])  # type: ignore[arg-type]
            output_tokens: int = int(llm_result["output_tokens"])  # type: ignore[arg-type]

            # ── h. Parse JSON response ────────────────────────────────────────
            try:
                parsed = json.loads(raw_text)
                reply_text: str = str(parsed.get("reply_text", ""))
                confidence: float = float(parsed.get("confidence", 0.0))
                should_escalate: bool = bool(parsed.get("should_escalate", False))
            except (json.JSONDecodeError, ValueError, TypeError) as parse_exc:
                logger.warning(
                    "ai_run_invalid_json",
                    run_id=str(run.id),
                    error=str(parse_exc),
                )
                run = await self._ai_repo.update_run(
                    db=db,
                    run_id=run.id,
                    status=AiRunStatus.FAILED,
                    failure_reason="invalid_json_response",
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    completed_at=utc_now(),
                )
                await db.commit()
                return run

            # ── i. Update ai_run with LLM results ────────────────────────────
            run = await self._ai_repo.update_run(
                db=db,
                run_id=run.id,
                status=AiRunStatus.COMPLETED,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                confidence_score=confidence,
                generated_text=reply_text,
            )

            # ── j. Decide outcome ─────────────────────────────────────────────
            decision: AiDecision

            if should_escalate or confidence < confidence_threshold:
                # Escalate — move conversation to handoff, do NOT send a reply
                decision = AiDecision.ESCALATED
                await db.execute(
                    update(Conversation)
                    .where(Conversation.id == conversation_id)
                    .values(
                        status=ConversationStatus.HANDOFF,
                        ai_paused=True,
                        updated_at=utc_now(),
                    )
                )
                await log_action(
                    db=db,
                    action="ai_reply.escalated",
                    target_type="conversation",
                    target_id=str(conversation_id),
                    workspace_id=workspace_id,
                    metadata={"confidence": confidence, "should_escalate": should_escalate},
                )
                logger.info(
                    "ai_run_escalated",
                    run_id=str(run.id),
                    confidence=confidence,
                    should_escalate=should_escalate,
                )

            elif reply_mode == ReplyMode.APPROVAL_REQUIRED:
                # Draft — create queued outbound message, do NOT enqueue delivery
                decision = AiDecision.REPLIED
                outbound = Message(
                    conversation_id=conversation_id,
                    workspace_id=workspace_id,
                    instagram_account_id=account.id,
                    sender_type=SenderType.AI,
                    direction=MessageDirection.OUTBOUND,
                    message_type=MessageType.TEXT,
                    text_content=reply_text,
                    status=MessageStatus.QUEUED,
                )
                db.add(outbound)
                await db.flush()
                logger.info(
                    "ai_run_draft_created",
                    run_id=str(run.id),
                    message_id=str(outbound.id),
                )

            else:
                # Automatic — create queued message and enqueue delivery
                decision = AiDecision.REPLIED
                outbound = Message(
                    conversation_id=conversation_id,
                    workspace_id=workspace_id,
                    instagram_account_id=account.id,
                    sender_type=SenderType.AI,
                    direction=MessageDirection.OUTBOUND,
                    message_type=MessageType.TEXT,
                    text_content=reply_text,
                    status=MessageStatus.QUEUED,
                )
                db.add(outbound)
                await db.flush()
                await db.commit()
                send_outbound_message.delay(str(outbound.id))
                logger.info(
                    "ai_run_reply_queued",
                    run_id=str(run.id),
                    message_id=str(outbound.id),
                )

            # ── k. Final ai_run update ────────────────────────────────────────
            run = await self._ai_repo.update_run(
                db=db,
                run_id=run.id,
                decision=decision,
                completed_at=utc_now(),
            )
            await db.commit()
            return run

        except Exception as exc:
            # Guarantee terminal state — mark failed
            if run is not None:
                try:
                    run = await self._ai_repo.update_run(
                        db=db,
                        run_id=run.id,
                        status=AiRunStatus.FAILED,
                        failure_reason=str(exc)[:1000],
                        completed_at=utc_now(),
                    )
                    await db.commit()
                except Exception:
                    pass  # DB might itself be broken — don't hide original error

            logger.error(
                "ai_run_failed",
                conversation_id=str(conversation_id),
                error=str(exc),
                exc_info=True,
            )
            raise


def get_ai_service() -> AiService:
    return AiService()

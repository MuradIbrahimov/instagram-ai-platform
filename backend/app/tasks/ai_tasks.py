import asyncio
import uuid

from sqlalchemy import select

from app.core.database import SyncSessionLocal
from app.core.exceptions import AppException
from app.core.logging import get_logger
from app.models.conversation import Conversation
from app.services.ai_service import AiService
from app.tasks.celery_app import celery_app

logger = get_logger(__name__)


@celery_app.task(
    queue="ai",
    bind=True,
    max_retries=2,
    name="app.tasks.ai_tasks.generate_ai_reply",
)
def generate_ai_reply(self, conversation_id: str, trigger_message_id: str) -> dict[str, str]:
    logger.info(
        "ai_task_started",
        conversation_id=conversation_id,
        trigger_message_id=trigger_message_id,
        task_id=self.request.id,
    )

    try:
        parsed_conversation_id = uuid.UUID(conversation_id)
        parsed_trigger_message_id = uuid.UUID(trigger_message_id)
    except ValueError:
        logger.warning(
            "ai_task_invalid_ids",
            conversation_id=conversation_id,
            trigger_message_id=trigger_message_id,
        )
        return {"status": "invalid_ids"}

    # Resolve workspace_id from the conversation record using sync session
    with SyncSessionLocal() as db:
        conversation = db.execute(
            select(Conversation).where(Conversation.id == parsed_conversation_id)
        ).scalar_one_or_none()

        if conversation is None:
            logger.warning("ai_task_conversation_not_found", conversation_id=conversation_id)
            return {"status": "conversation_not_found"}

        workspace_id: uuid.UUID = conversation.workspace_id

    # Run async service in a fresh event loop (Celery worker is synchronous)
    ai_service = AiService()

    try:
        from app.core.database import SessionLocal as AsyncSessionLocal

        async def _run() -> dict[str, str]:
            async with AsyncSessionLocal() as async_db:
                run = await ai_service.generate_reply(
                    db=async_db,
                    conversation_id=parsed_conversation_id,
                    trigger_message_id=parsed_trigger_message_id,
                    workspace_id=workspace_id,
                )
            return {"status": run.status.value, "run_id": str(run.id)}

        return asyncio.run(_run())

    except AppException as exc:
        if exc.code == "llm_error":
            logger.warning(
                "ai_task_llm_error_retrying",
                conversation_id=conversation_id,
                error=exc.message,
                attempt=self.request.retries,
            )
            raise self.retry(exc=exc, countdown=10)
        # Data / logic errors — do not retry
        logger.error(
            "ai_task_app_error",
            conversation_id=conversation_id,
            code=exc.code,
            error=exc.message,
        )
        return {"status": "failed", "error": exc.message}

    except Exception as exc:
        logger.error(
            "ai_task_unexpected_error",
            conversation_id=conversation_id,
            error=str(exc),
            exc_info=True,
        )
        return {"status": "failed", "error": str(exc)}

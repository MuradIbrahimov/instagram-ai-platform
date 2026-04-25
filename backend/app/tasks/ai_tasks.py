from app.core.logging import get_logger
from app.tasks.celery_app import celery_app

logger = get_logger(__name__)


@celery_app.task(queue="ai", bind=True, name="app.tasks.ai_tasks.generate_ai_reply")
def generate_ai_reply(self, conversation_id: str, trigger_message_id: str) -> dict[str, str]:
    logger.info(
        "ai_task_received",
        conversation_id=conversation_id,
        trigger_message_id=trigger_message_id,
        task_id=self.request.id,
    )
    return {"status": "ai_not_implemented_yet"}

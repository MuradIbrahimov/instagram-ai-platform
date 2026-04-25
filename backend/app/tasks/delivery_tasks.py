import asyncio
import uuid
from typing import Any

import httpx
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import SyncSessionLocal
from app.core.exceptions import AppException
from app.core.logging import get_logger
from app.integrations.meta.client import MetaClient
from app.models.conversation import Conversation
from app.models.instagram_account import InstagramAccount
from app.models.message import Message, MessageStatus
from app.repositories.instagram_repo import InstagramRepository
from app.tasks.celery_app import celery_app

logger = get_logger(__name__)


def _with_attempt(raw_payload: dict[str, Any] | None, attempts: int) -> dict[str, Any]:
    payload = dict(raw_payload or {})
    payload["delivery_attempts"] = attempts
    return payload


@celery_app.task(
    queue="delivery",
    bind=True,
    max_retries=5,
    name="app.tasks.delivery_tasks.send_outbound_message",
)
def send_outbound_message(self, message_id: str) -> dict[str, str]:
    instagram_repo = InstagramRepository()
    settings = get_settings()

    with SyncSessionLocal() as db:
        try:
            parsed_message_id = uuid.UUID(message_id)
        except ValueError:
            logger.warning("delivery_task_invalid_message_id", message_id=message_id)
            return {"status": "invalid_message_id"}

        message = db.get(Message, parsed_message_id)
        if message is None:
            logger.warning("delivery_task_message_not_found", message_id=message_id)
            return {"status": "message_not_found"}

        if message.status != MessageStatus.QUEUED:
            return {"status": "skipped_not_queued"}

        conversation = db.execute(
            select(Conversation).where(Conversation.id == message.conversation_id)
        ).scalar_one_or_none()
        account = db.execute(
            select(InstagramAccount).where(InstagramAccount.id == message.instagram_account_id)
        ).scalar_one_or_none()

        if conversation is None or account is None or not account.access_token_encrypted:
            message.status = MessageStatus.FAILED
            message.error_message = "Missing conversation/account/token for delivery"
            db.commit()
            return {"status": "failed_missing_dependencies"}

        access_token = instagram_repo.decrypt_token(account.access_token_encrypted)
        client = MetaClient(access_token=access_token, api_version=settings.meta_graph_api_version)

        try:
            response = asyncio.run(
                client.send_dm(
                    recipient_ig_user_id=conversation.customer_ig_user_id,
                    message_text=message.text_content or "",
                )
            )
            message.status = MessageStatus.SENT
            message.external_message_id = response.get("message_id")
            message.error_message = None
            db.commit()
            return {"status": "sent"}
        except httpx.RequestError as exc:
            attempts = self.request.retries + 1
            message.raw_payload = _with_attempt(message.raw_payload, attempts)
            message.error_message = f"Network error: {str(exc)}"
            db.commit()
            countdown = 2 ** self.request.retries
            raise self.retry(exc=exc, countdown=countdown)
        except AppException as exc:
            if 500 <= exc.status_code < 600:
                attempts = self.request.retries + 1
                message.raw_payload = _with_attempt(message.raw_payload, attempts)
                message.error_message = exc.message
                db.commit()
                countdown = 2 ** self.request.retries
                raise self.retry(exc=exc, countdown=countdown)

            message.status = MessageStatus.FAILED
            message.error_message = exc.message
            db.commit()
            return {"status": "failed_non_retryable"}

from datetime import UTC, datetime
import uuid
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert

from app.core.database import SyncSessionLocal
from app.core.logging import get_logger
from app.integrations.meta.webhook import parse_webhook_payload
from app.models.conversation import Conversation, ConversationStatus
from app.models.instagram_account import InstagramAccount, ReplyMode
from app.models.message import Message, MessageDirection, MessageStatus, MessageType, SenderType
from app.models.webhook_event import WebhookEvent
from app.models.workspace import Workspace
from app.tasks.ai_tasks import generate_ai_reply
from app.tasks.celery_app import celery_app

logger = get_logger(__name__)


def _to_utc_timestamp(raw_timestamp: int | None) -> datetime:
    if raw_timestamp is None:
        return datetime.now(UTC)
    if raw_timestamp > 10_000_000_000:
        return datetime.fromtimestamp(raw_timestamp / 1000, tz=UTC)
    return datetime.fromtimestamp(raw_timestamp, tz=UTC)


def is_ai_eligible(
    workspace_auto_reply_enabled: bool,
    account_auto_reply_enabled: bool,
    account_reply_mode: str,
    conversation_ai_paused: bool,
    conversation_status: str,
    message_type: str,
) -> bool:
    if not workspace_auto_reply_enabled:
        return False
    if not account_auto_reply_enabled:
        return False
    if account_reply_mode == "human_only":
        return False
    if conversation_ai_paused:
        return False
    if conversation_status == "handoff":
        return False
    if message_type not in {"text"}:
        return False
    return True


@celery_app.task(
    queue="webhooks",
    bind=True,
    max_retries=3,
    name="app.tasks.webhook_tasks.process_webhook_event",
)
def process_webhook_event(self, webhook_event_id: str) -> dict[str, int | str]:
    try:
        parsed_webhook_event_id = uuid.UUID(webhook_event_id)
    except ValueError:
        logger.warning("webhook_task_invalid_event_id", webhook_event_id=webhook_event_id)
        return {"status": "invalid_event_id", "processed_messages": 0}

    processed_messages = 0
    skipped_messages = 0

    try:
        with SyncSessionLocal() as db:
            webhook_event = db.get(WebhookEvent, parsed_webhook_event_id)
            if webhook_event is None:
                logger.warning("webhook_event_not_found", webhook_event_id=webhook_event_id)
                return {"status": "not_found", "processed_messages": 0}

            if webhook_event.processed:
                logger.info("webhook_event_already_processed", webhook_event_id=webhook_event_id)
                return {"status": "already_processed", "processed_messages": 0}

            parsed_events = parse_webhook_payload(webhook_event.payload)

            for event in parsed_events:
                sender_id = event.get("sender_id")
                recipient_id = event.get("recipient_id")
                message_external_id = event.get("message_id")
                message_text = event.get("message_text")
                message_type_raw = event.get("message_type")
                timestamp = _to_utc_timestamp(event.get("timestamp"))

                if not isinstance(sender_id, str) or not isinstance(recipient_id, str):
                    skipped_messages += 1
                    continue

                account = db.execute(
                    select(InstagramAccount).where(InstagramAccount.instagram_account_id == recipient_id)
                ).scalar_one_or_none()
                if account is None:
                    logger.warning(
                        "webhook_account_not_found",
                        webhook_event_id=webhook_event_id,
                        recipient_id=recipient_id,
                    )
                    skipped_messages += 1
                    continue

                workspace = db.execute(
                    select(Workspace).where(Workspace.id == account.workspace_id)
                ).scalar_one_or_none()
                if workspace is None:
                    skipped_messages += 1
                    continue

                conversation_upsert = (
                    insert(Conversation)
                    .values(
                        workspace_id=account.workspace_id,
                        instagram_account_id=account.id,
                        customer_ig_user_id=sender_id,
                        customer_username=sender_id,
                        last_message_at=timestamp,
                        last_inbound_at=timestamp,
                    )
                    .on_conflict_do_update(
                        index_elements=[
                            Conversation.instagram_account_id,
                            Conversation.customer_ig_user_id,
                        ],
                        set_={
                            "last_message_at": timestamp,
                            "last_inbound_at": timestamp,
                            "updated_at": datetime.now(UTC),
                        },
                    )
                    .returning(Conversation.id)
                )
                conversation_id = db.execute(conversation_upsert).scalar_one()
                conversation = db.get(Conversation, conversation_id)
                if conversation is None:
                    skipped_messages += 1
                    continue

                if isinstance(message_external_id, str):
                    existing_message = db.execute(
                        select(Message).where(Message.external_message_id == message_external_id)
                    ).scalar_one_or_none()
                    if existing_message is not None:
                        skipped_messages += 1
                        continue

                message_type = MessageType.TEXT
                if isinstance(message_type_raw, str):
                    try:
                        message_type = MessageType(message_type_raw)
                    except ValueError:
                        message_type = MessageType.ATTACHMENT

                inbound_message = Message(
                    conversation_id=conversation.id,
                    workspace_id=account.workspace_id,
                    instagram_account_id=account.id,
                    external_message_id=message_external_id if isinstance(message_external_id, str) else None,
                    sender_type=SenderType.CUSTOMER,
                    direction=MessageDirection.INBOUND,
                    message_type=message_type,
                    text_content=message_text if isinstance(message_text, str) else None,
                    raw_payload=event,
                    status=MessageStatus.RECEIVED,
                    created_at=timestamp,
                )
                db.add(inbound_message)
                db.flush()

                db.execute(
                    update(Conversation)
                    .where(Conversation.id == conversation.id)
                    .values(
                        last_message_at=timestamp,
                        last_inbound_at=timestamp,
                        unread_count=Conversation.unread_count + 1,
                    )
                )

                if is_ai_eligible(
                    workspace_auto_reply_enabled=workspace.auto_reply_enabled,
                    account_auto_reply_enabled=account.auto_reply_enabled,
                    account_reply_mode=account.reply_mode.value if isinstance(account.reply_mode, ReplyMode) else str(account.reply_mode),
                    conversation_ai_paused=conversation.ai_paused,
                    conversation_status=conversation.status.value if isinstance(conversation.status, ConversationStatus) else str(conversation.status),
                    message_type=message_type.value,
                ):
                    generate_ai_reply.apply_async(
                        args=[str(conversation.id), str(inbound_message.id)],
                        queue="ai",
                    )

                processed_messages += 1

            webhook_event.processed = True
            webhook_event.processed_at = datetime.now(UTC)
            webhook_event.error_message = None
            db.commit()

        return {
            "status": "processed",
            "processed_messages": processed_messages,
            "skipped_messages": skipped_messages,
        }
    except Exception as exc:
        logger.exception("webhook_event_processing_failed", webhook_event_id=webhook_event_id, error=str(exc))
        with SyncSessionLocal() as error_db:
            event = error_db.get(WebhookEvent, parsed_webhook_event_id)
            if event is not None:
                event.error_message = str(exc)
                error_db.commit()
        countdown = 2 ** self.request.retries
        raise self.retry(exc=exc, countdown=countdown)

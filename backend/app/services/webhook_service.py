import json
from json import JSONDecodeError

from fastapi import Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.exceptions import AppException
from app.core.logging import get_logger
from app.integrations.meta.webhook import compute_event_hash, verify_signature
from app.repositories.webhook_event_repo import WebhookEventRepository
from app.tasks.webhook_tasks import process_webhook_event

logger = get_logger(__name__)


class WebhookService:
    def __init__(
        self,
        db: AsyncSession,
        webhook_event_repo: WebhookEventRepository,
    ) -> None:
        self.db = db
        self.webhook_event_repo = webhook_event_repo
        self.settings = get_settings()

    async def handle_verification(self, mode: str, token: str, challenge: str) -> str:
        if mode != "subscribe" or token != self.settings.meta_verify_token:
            raise AppException(
                code="webhook_verification_failed",
                message="Webhook verification failed",
                status_code=403,
            )
        return challenge

    async def handle_incoming(self, payload_bytes: bytes, signature_header: str | None) -> None:
        is_valid = verify_signature(
            payload_bytes=payload_bytes,
            signature_header=signature_header,
            app_secret=self.settings.meta_app_secret,
        )
        if not is_valid:
            raise AppException(
                code="invalid_signature",
                message="Invalid webhook signature",
                status_code=403,
            )

        try:
            payload = json.loads(payload_bytes.decode("utf-8"))
        except (UnicodeDecodeError, JSONDecodeError) as exc:
            raise AppException(
                code="invalid_payload",
                message="Invalid webhook payload",
                status_code=400,
            ) from exc

        if not isinstance(payload, dict):
            raise AppException(
                code="invalid_payload",
                message="Invalid webhook payload",
                status_code=400,
            )

        event_hash = compute_event_hash(payload)
        existing = await self.webhook_event_repo.get_by_hash(
            db=self.db,
            event_id_hash=event_hash,
        )
        if existing is not None:
            logger.info("duplicate_webhook_event_ignored", event_id_hash=event_hash)
            return

        event_type = str(payload.get("object", "unknown"))
        try:
            webhook_event = await self.webhook_event_repo.create(
                db=self.db,
                event_type=event_type,
                event_id_hash=event_hash,
                payload=payload,
            )
        except IntegrityError:
            await self.db.rollback()
            logger.info("duplicate_webhook_event_race_ignored", event_id_hash=event_hash)
            return

        await self.db.commit()
        process_webhook_event.apply_async(args=[str(webhook_event.id)], queue="webhooks")


def get_webhook_service(db: AsyncSession = Depends(get_db)) -> WebhookService:
    return WebhookService(db=db, webhook_event_repo=WebhookEventRepository())

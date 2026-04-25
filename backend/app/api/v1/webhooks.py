from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import PlainTextResponse

from app.core.exceptions import AppException
from app.core.logging import get_logger
from app.services.webhook_service import WebhookService, get_webhook_service

logger = get_logger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.get("/meta", response_class=PlainTextResponse)
async def verify_meta_webhook(
    request: Request,
    mode: str = Query(alias="hub.mode"),
    verify_token: str = Query(alias="hub.verify_token"),
    challenge: str = Query(alias="hub.challenge"),
    service: WebhookService = Depends(get_webhook_service),
) -> PlainTextResponse:
    try:
        verified = await service.handle_verification(mode=mode, token=verify_token, challenge=challenge)
        return PlainTextResponse(content=verified)
    except AppException:
        client_ip = request.client.host if request.client else "unknown"
        logger.warning("webhook_verification_failed", client_ip=client_ip)
        return PlainTextResponse(content="forbidden", status_code=403)


@router.post("/meta")
async def receive_meta_webhook(
    request: Request,
    service: WebhookService = Depends(get_webhook_service),
) -> Response:
    body = await request.body()
    signature = request.headers.get("x-hub-signature-256")

    try:
        await service.handle_incoming(payload_bytes=body, signature_header=signature)
    except Exception as exc:
        client_ip = request.client.host if request.client else "unknown"
        logger.error(
            "webhook_ingestion_failed",
            client_ip=client_ip,
            error=str(exc),
        )

    return Response(status_code=200)

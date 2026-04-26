import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_workspace_access
from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.conversation import ConversationStatus
from app.models.membership import WorkspaceRole
from app.models.message import Message, MessageStatus
from app.models.workspace import Workspace
from app.schemas.conversations import (
    AssignConversationRequest,
    ConversationFilters,
    ConversationListItem,
    ConversationResponse,
    ConversationUpdate,
)
from app.schemas.messages import MessageCreate, MessageResponse
from app.services.audit_service import log_action
from app.services.conversation_service import ConversationService, get_conversation_service
from app.services.message_service import MessageService, get_message_service

router = APIRouter(prefix="/workspaces/{workspace_id}/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationListItem])
async def list_conversations(
    workspace_id: uuid.UUID,
    status: ConversationStatus | None = Query(default=None),
    instagram_account_id: uuid.UUID | None = Query(default=None),
    assigned_user_id: uuid.UUID | None = Query(default=None),
    ai_paused: bool | None = Query(default=None),
    unread_only: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    conversation_service: ConversationService = Depends(get_conversation_service),
) -> list[ConversationListItem]:
    filters = ConversationFilters(
        status=status,
        instagram_account_id=instagram_account_id,
        assigned_user_id=assigned_user_id,
        ai_paused=ai_paused,
        unread_only=unread_only,
        search=search,
    )
    return await conversation_service.list_conversations(
        db=db,
        workspace_id=workspace_id,
        filters=filters,
        page=page,
        page_size=page_size,
    )


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    workspace_id: uuid.UUID,
    conversation_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    conversation_service: ConversationService = Depends(get_conversation_service),
) -> ConversationResponse:
    await conversation_service.mark_read(
        db=db,
        conversation_id=conversation_id,
        workspace_id=workspace_id,
    )
    return await conversation_service.get_conversation(
        db=db,
        conversation_id=conversation_id,
        workspace_id=workspace_id,
    )


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    workspace_id: uuid.UUID,
    conversation_id: uuid.UUID,
    payload: ConversationUpdate,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    conversation_service: ConversationService = Depends(get_conversation_service),
) -> ConversationResponse:
    return await conversation_service.update_conversation(
        db=db,
        conversation_id=conversation_id,
        workspace_id=workspace_id,
        data=payload,
    )


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    workspace_id: uuid.UUID,
    conversation_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    message_service: MessageService = Depends(get_message_service),
) -> list[MessageResponse]:
    return await message_service.list_messages(
        db=db,
        conversation_id=conversation_id,
        workspace_id=workspace_id,
        page=page,
        page_size=page_size,
    )


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def create_message(
    workspace_id: uuid.UUID,
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    message_service: MessageService = Depends(get_message_service),
) -> MessageResponse:
    return await message_service.create_outbound(
        db=db,
        conversation_id=conversation_id,
        workspace_id=workspace_id,
        text_content=payload.text_content,
        sender_type="human",
    )


@router.post("/{conversation_id}/assign", response_model=ConversationResponse)
async def assign_conversation(
    workspace_id: uuid.UUID,
    conversation_id: uuid.UUID,
    payload: AssignConversationRequest,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    conversation_service: ConversationService = Depends(get_conversation_service),
) -> ConversationResponse:
    return await conversation_service.assign(
        db=db,
        conversation_id=conversation_id,
        user_id=payload.user_id,
        workspace_id=workspace_id,
    )


@router.post("/{conversation_id}/pause-ai", response_model=ConversationResponse)
async def pause_ai(
    workspace_id: uuid.UUID,
    conversation_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    conversation_service: ConversationService = Depends(get_conversation_service),
) -> ConversationResponse:
    return await conversation_service.pause_ai(
        db=db,
        conversation_id=conversation_id,
        workspace_id=workspace_id,
    )


@router.post("/{conversation_id}/resume-ai", response_model=ConversationResponse)
async def resume_ai(
    workspace_id: uuid.UUID,
    conversation_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    conversation_service: ConversationService = Depends(get_conversation_service),
) -> ConversationResponse:
    return await conversation_service.resume_ai(
        db=db,
        conversation_id=conversation_id,
        workspace_id=workspace_id,
    )


# ─── Message approval / rejection ─────────────────────────────────────────────

@router.post(
    "/{conversation_id}/messages/{message_id}/approve",
    response_model=MessageResponse,
    summary="Approve a queued AI draft and enqueue for delivery",
)
async def approve_message(
    workspace_id: uuid.UUID,
    conversation_id: uuid.UUID,
    message_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Approve a queued AI-drafted message and enqueue it for delivery."""
    from app.tasks.delivery_tasks import send_outbound_message

    message = await db.get(Message, message_id)
    if message is None or message.workspace_id != workspace_id or message.conversation_id != conversation_id:
        raise AppException(
            code="message_not_found",
            message="Message not found",
            status_code=404,
        )
    if message.status != MessageStatus.QUEUED:
        raise AppException(
            code="message_not_approvable",
            message=f"Message status is '{message.status.value}', expected 'queued'",
            status_code=409,
        )

    send_outbound_message.delay(str(message.id))

    await log_action(
        db=db,
        action="message.approved",
        target_type="message",
        target_id=str(message.id),
        workspace_id=workspace_id,
    )

    return MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_type=message.sender_type,
        direction=message.direction,
        message_type=message.message_type,
        text_content=message.text_content,
        status=message.status,
        created_at=message.created_at,
    )


@router.post(
    "/{conversation_id}/messages/{message_id}/reject",
    response_model=MessageResponse,
    summary="Reject a queued AI draft",
)
async def reject_message(
    workspace_id: uuid.UUID,
    conversation_id: uuid.UUID,
    message_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Reject a queued AI-drafted message (marks it failed)."""
    message = await db.get(Message, message_id)
    if message is None or message.workspace_id != workspace_id or message.conversation_id != conversation_id:
        raise AppException(
            code="message_not_found",
            message="Message not found",
            status_code=404,
        )
    if message.status != MessageStatus.QUEUED:
        raise AppException(
            code="message_not_rejectable",
            message=f"Message status is '{message.status.value}', expected 'queued'",
            status_code=409,
        )

    message.status = MessageStatus.FAILED
    message.error_message = "rejected_by_agent"
    await db.flush()

    await log_action(
        db=db,
        action="message.rejected",
        target_type="message",
        target_id=str(message.id),
        workspace_id=workspace_id,
    )

    return MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_type=message.sender_type,
        direction=message.direction,
        message_type=message.message_type,
        text_content=message.text_content,
        status=message.status,
        created_at=message.created_at,
    )

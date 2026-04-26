"""AI settings endpoints.

GET  /workspaces/{workspace_id}/ai/settings
     Returns ai-related settings for every instagram account in the workspace.

PATCH /workspaces/{workspace_id}/instagram/accounts/{account_id}/ai-settings
      Update confidence_threshold and/or reply_mode. Requires admin or owner.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_workspace_access, require_role
from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.instagram_account import ReplyMode
from app.models.membership import WorkspaceRole
from app.models.workspace import Workspace
from app.repositories.instagram_repo import InstagramRepository

router = APIRouter(tags=["ai-settings"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class AccountAiSettings(BaseModel):
    account_id: uuid.UUID
    instagram_username: str
    auto_reply_enabled: bool
    reply_mode: ReplyMode
    confidence_threshold: float


class WorkspaceAiSettingsResponse(BaseModel):
    accounts: list[AccountAiSettings]


class AiSettingsUpdate(BaseModel):
    reply_mode: ReplyMode | None = None
    confidence_threshold: float | None = Field(default=None, ge=0.0, le=1.0)
    auto_reply_enabled: bool | None = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get(
    "/workspaces/{workspace_id}/ai/settings",
    response_model=WorkspaceAiSettingsResponse,
)
async def get_ai_settings(
    workspace_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
) -> WorkspaceAiSettingsResponse:
    repo = InstagramRepository()
    accounts = await repo.list_for_workspace(db=db, workspace_id=workspace_id)
    return WorkspaceAiSettingsResponse(
        accounts=[
            AccountAiSettings(
                account_id=account.id,
                instagram_username=account.instagram_username,
                auto_reply_enabled=account.auto_reply_enabled,
                reply_mode=account.reply_mode,
                confidence_threshold=account.confidence_threshold,
            )
            for account in accounts
        ]
    )


@router.patch(
    "/workspaces/{workspace_id}/instagram/accounts/{account_id}/ai-settings",
    response_model=AccountAiSettings,
)
async def update_ai_settings(
    workspace_id: uuid.UUID,
    account_id: uuid.UUID,
    payload: AiSettingsUpdate,
    _: tuple[Workspace, WorkspaceRole] = Depends(require_role(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)),
    db: AsyncSession = Depends(get_db),
) -> AccountAiSettings:
    repo = InstagramRepository()
    account = await repo.get_by_id(
        db=db, account_id=account_id, workspace_id=workspace_id
    )
    if account is None:
        raise AppException(
            code="instagram_account_not_found",
            message="Instagram account not found",
            status_code=404,
        )

    if payload.reply_mode is not None:
        account.reply_mode = payload.reply_mode
    if payload.confidence_threshold is not None:
        account.confidence_threshold = payload.confidence_threshold
    if payload.auto_reply_enabled is not None:
        account.auto_reply_enabled = payload.auto_reply_enabled

    await db.flush()
    await db.refresh(account)

    return AccountAiSettings(
        account_id=account.id,
        instagram_username=account.instagram_username,
        auto_reply_enabled=account.auto_reply_enabled,
        reply_mode=account.reply_mode,
        confidence_threshold=account.confidence_threshold,
    )

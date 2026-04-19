import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_active_user, get_workspace_access
from app.core.database import get_db
from app.models.membership import WorkspaceRole
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.instagram import (
    InstagramAccountCreate,
    InstagramAccountResponse,
    InstagramAccountUpdate,
)
from app.services.instagram_service import InstagramService, get_instagram_service

router = APIRouter(prefix="/workspaces/{workspace_id}/instagram", tags=["instagram"])


@router.post("/accounts", response_model=InstagramAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    workspace_id: uuid.UUID,
    payload: InstagramAccountCreate,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
    instagram_service: InstagramService = Depends(get_instagram_service),
) -> InstagramAccountResponse:
    return await instagram_service.create_account(
        db=db,
        workspace_id=workspace_id,
        data=payload,
        current_user=current_user,
    )


@router.get("/accounts", response_model=list[InstagramAccountResponse])
async def list_accounts(
    workspace_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    instagram_service: InstagramService = Depends(get_instagram_service),
) -> list[InstagramAccountResponse]:
    return await instagram_service.list_accounts(db=db, workspace_id=workspace_id)


@router.get("/accounts/{account_id}", response_model=InstagramAccountResponse)
async def get_account(
    workspace_id: uuid.UUID,
    account_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    instagram_service: InstagramService = Depends(get_instagram_service),
) -> InstagramAccountResponse:
    return await instagram_service.get_account(
        db=db,
        account_id=account_id,
        workspace_id=workspace_id,
    )


@router.patch("/accounts/{account_id}", response_model=InstagramAccountResponse)
async def update_account(
    workspace_id: uuid.UUID,
    account_id: uuid.UUID,
    payload: InstagramAccountUpdate,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    db: AsyncSession = Depends(get_db),
    instagram_service: InstagramService = Depends(get_instagram_service),
) -> InstagramAccountResponse:
    return await instagram_service.update_account(
        db=db,
        account_id=account_id,
        workspace_id=workspace_id,
        data=payload,
    )


@router.post("/accounts/{account_id}/sync")
async def sync_account(
    workspace_id: uuid.UUID,
    account_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
) -> dict[str, str]:
    _ = workspace_id
    _ = account_id
    return {"status": "sync_queued"}

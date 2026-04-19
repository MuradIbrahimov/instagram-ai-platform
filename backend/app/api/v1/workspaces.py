import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_active_user, get_workspace_access
from app.core.database import get_db
from app.models.membership import WorkspaceRole
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspaces import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceWithRoleResponse,
)
from app.services.workspace_service import WorkspaceService, get_workspace_service

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
) -> WorkspaceResponse:
    return await workspace_service.create_workspace(
        db=db,
        name=payload.name,
        slug=payload.slug,
        current_user=current_user,
    )


@router.get("", response_model=list[WorkspaceWithRoleResponse])
async def list_workspaces(
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
) -> list[WorkspaceWithRoleResponse]:
    return await workspace_service.list_workspaces(db=db, current_user=current_user)


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
) -> WorkspaceResponse:
    return await workspace_service.get_workspace(
        db=db,
        workspace_id=workspace_id,
        current_user=current_user,
    )

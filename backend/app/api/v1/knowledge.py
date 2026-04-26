from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_workspace_access, require_role
from app.core.database import get_db
from app.models.membership import WorkspaceRole
from app.models.workspace import Workspace
from app.schemas.common import PaginatedResponse, pagination_params, PaginationQueryParams
from app.schemas.knowledge import DocumentCreate, DocumentListItem, DocumentResponse
from app.services.knowledge_service import KnowledgeService, get_knowledge_service

router = APIRouter(
    prefix="/workspaces/{workspace_id}/knowledge",
    tags=["knowledge"],
)

# Roles allowed for read/write operations (agent and above)
_agent_or_higher = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.AGENT]
# Roles allowed for destructive operations
_admin_or_higher = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]


@router.post(
    "/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    workspace_id: uuid.UUID,
    payload: DocumentCreate,
    _: tuple[Workspace, WorkspaceRole] = Depends(require_role(*_agent_or_higher)),
    db: AsyncSession = Depends(get_db),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
) -> DocumentResponse:
    return await knowledge_service.create_document(
        db=db,
        workspace_id=workspace_id,
        payload=payload,
    )


@router.get(
    "/documents",
    response_model=PaginatedResponse[DocumentListItem],
)
async def list_documents(
    workspace_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(require_role(*_agent_or_higher)),
    db: AsyncSession = Depends(get_db),
    pagination: PaginationQueryParams = Depends(pagination_params),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
) -> PaginatedResponse[DocumentListItem]:
    return await knowledge_service.list_documents(
        db=db,
        workspace_id=workspace_id,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get(
    "/documents/{document_id}",
    response_model=DocumentResponse,
)
async def get_document(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(require_role(*_agent_or_higher)),
    db: AsyncSession = Depends(get_db),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
) -> DocumentResponse:
    return await knowledge_service.get_document(
        db=db,
        document_id=document_id,
        workspace_id=workspace_id,
    )


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_document(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    _: tuple[Workspace, WorkspaceRole] = Depends(require_role(*_admin_or_higher)),
    db: AsyncSession = Depends(get_db),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
) -> None:
    await knowledge_service.delete_document(
        db=db,
        document_id=document_id,
        workspace_id=workspace_id,
    )

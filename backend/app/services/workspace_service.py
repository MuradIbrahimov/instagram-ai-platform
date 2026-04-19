import re
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.workspace_repo import WorkspaceRepository
from app.schemas.workspaces import (
    WorkspaceResponse,
    WorkspaceWithRoleResponse,
)


class WorkspaceService:
    def __init__(self, workspace_repo: WorkspaceRepository) -> None:
        self.workspace_repo = workspace_repo

    async def create_workspace(
        self,
        db: AsyncSession,
        name: str,
        slug: str | None,
        current_user: User,
    ) -> WorkspaceResponse:
        base_slug = self._slugify(slug if slug is not None else name)
        unique_slug = await self._build_unique_slug(db=db, base_slug=base_slug)

        workspace = await self.workspace_repo.create(
            db=db,
            name=name,
            slug=unique_slug,
            owner_user_id=current_user.id,
        )
        return self._to_workspace_response(workspace)

    async def list_workspaces(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> list[WorkspaceWithRoleResponse]:
        rows = await self.workspace_repo.get_for_user(db=db, user_id=current_user.id)
        return [
            WorkspaceWithRoleResponse(
                id=workspace.id,
                name=workspace.name,
                slug=workspace.slug,
                timezone=workspace.timezone,
                auto_reply_enabled=workspace.auto_reply_enabled,
                created_at=workspace.created_at,
                role=role,
            )
            for workspace, role in rows
        ]

    async def get_workspace(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        current_user: User,
    ) -> WorkspaceResponse:
        _ = current_user
        workspace = await self.workspace_repo.get_by_id(db=db, workspace_id=workspace_id)
        if workspace is None:
            raise AppException(
                code="forbidden",
                message="Workspace access denied",
                status_code=403,
            )
        return self._to_workspace_response(workspace)

    async def _build_unique_slug(self, db: AsyncSession, base_slug: str) -> str:
        candidate = base_slug
        suffix = 2
        while await self.workspace_repo.get_by_slug(db=db, slug=candidate) is not None:
            candidate = f"{base_slug}-{suffix}"
            suffix += 1
        return candidate

    def _slugify(self, value: str) -> str:
        normalized = re.sub(r"[^a-zA-Z0-9\s-]", "", value).strip().lower()
        slug = re.sub(r"[-\s]+", "-", normalized)
        return slug or "workspace"

    def _to_workspace_response(self, workspace: Workspace) -> WorkspaceResponse:
        return WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            timezone=workspace.timezone,
            auto_reply_enabled=workspace.auto_reply_enabled,
            created_at=workspace.created_at,
        )


def get_workspace_service() -> WorkspaceService:
    return WorkspaceService(workspace_repo=WorkspaceRepository())

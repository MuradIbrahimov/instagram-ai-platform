import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.membership import WorkspaceMembership, WorkspaceRole
from app.models.workspace import Workspace


class WorkspaceRepository:
    async def create(
        self,
        db: AsyncSession,
        name: str,
        slug: str,
        owner_user_id: uuid.UUID,
    ) -> Workspace:
        workspace = Workspace(name=name, slug=slug)
        db.add(workspace)
        await db.flush()

        membership = WorkspaceMembership(
            workspace_id=workspace.id,
            user_id=owner_user_id,
            role=WorkspaceRole.OWNER,
        )
        db.add(membership)
        await db.flush()
        await db.refresh(workspace)
        return workspace

    async def get_by_id(self, db: AsyncSession, workspace_id: uuid.UUID) -> Workspace | None:
        result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Workspace | None:
        result = await db.execute(select(Workspace).where(Workspace.slug == slug))
        return result.scalar_one_or_none()

    async def get_for_user(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> list[tuple[Workspace, WorkspaceRole]]:
        query = (
            select(Workspace, WorkspaceMembership.role)
            .join(WorkspaceMembership, WorkspaceMembership.workspace_id == Workspace.id)
            .where(WorkspaceMembership.user_id == user_id)
            .order_by(Workspace.created_at.desc())
        )
        result = await db.execute(query)
        return [(workspace, role) for workspace, role in result.all()]

    async def get_member_role(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> WorkspaceRole | None:
        query = select(WorkspaceMembership.role).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == user_id,
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

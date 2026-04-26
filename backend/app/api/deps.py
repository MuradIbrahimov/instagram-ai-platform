from collections.abc import Callable
import uuid

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AppException
from app.core.logging import get_logger
from app.models.membership import WorkspaceRole
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.workspace_repo import WorkspaceRepository
from app.services.auth_service import AuthService, get_auth_service

logger = get_logger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    if token is None:
        logger.warning("deps.get_current_user", result="no_token")
        raise AppException(
            code="not_authenticated",
            message="Authentication credentials were not provided",
            status_code=401,
        )
    logger.debug("deps.get_current_user", result="token_present")
    return await auth_service.get_user_by_token(db=db, token=token)


async def get_active_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_active:
        raise AppException(
            code="inactive_user",
            message="User account is inactive",
            status_code=403,
        )
    return user


async def get_workspace_access(
    workspace_id: uuid.UUID,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> tuple[Workspace, WorkspaceRole]:
    logger.debug("deps.get_workspace_access", workspace_id=str(workspace_id), user_id=str(user.id))
    workspace_repo = WorkspaceRepository()
    role = await workspace_repo.get_member_role(
        db=db,
        workspace_id=workspace_id,
        user_id=user.id,
    )
    if role is None:
        logger.warning("deps.workspace_access_denied", workspace_id=str(workspace_id), user_id=str(user.id), reason="no_membership")
        raise AppException(
            code="forbidden",
            message="Workspace access denied",
            status_code=403,
        )

    workspace = await workspace_repo.get_by_id(db=db, workspace_id=workspace_id)
    if workspace is None:
        logger.warning("deps.workspace_access_denied", workspace_id=str(workspace_id), user_id=str(user.id), reason="workspace_not_found")
        raise AppException(
            code="forbidden",
            message="Workspace access denied",
            status_code=403,
        )
    logger.debug("deps.workspace_access_granted", workspace_id=str(workspace_id), user_id=str(user.id), role=str(role))
    return workspace, role


def require_role(*roles: WorkspaceRole | str) -> Callable:
    allowed_roles = {
        role.value if isinstance(role, WorkspaceRole) else role
        for role in roles
    }

    async def role_dependency(
        access: tuple[Workspace, WorkspaceRole] = Depends(get_workspace_access),
    ) -> tuple[Workspace, WorkspaceRole]:
        workspace, role = access
        role_value = role.value if isinstance(role, WorkspaceRole) else str(role)
        if role_value not in allowed_roles:
            raise AppException(
                code="forbidden",
                message="Insufficient workspace permissions",
                status_code=403,
            )
        return workspace, role

    return role_dependency

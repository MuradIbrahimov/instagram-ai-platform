import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.instagram_account import InstagramAccount
from app.models.user import User
from app.repositories.instagram_repo import InstagramRepository
from app.schemas.instagram import (
    InstagramAccountCreate,
    InstagramAccountResponse,
    InstagramAccountUpdate,
)
from app.services.audit_service import log_action


class InstagramService:
    def __init__(self, instagram_repo: InstagramRepository) -> None:
        self.instagram_repo = instagram_repo

    async def create_account(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        data: InstagramAccountCreate,
        current_user: User,
    ) -> InstagramAccountResponse:
        _ = current_user
        existing = await self.instagram_repo.get_by_instagram_id(
            db=db,
            instagram_account_id=data.instagram_account_id,
        )
        if existing is not None:
            raise AppException(
                code="instagram_account_exists",
                message="Instagram account is already connected",
                status_code=409,
            )

        payload = {
            "instagram_account_id": data.instagram_account_id,
            "instagram_username": data.instagram_username,
        }
        if data.access_token:
            payload["access_token_encrypted"] = self.instagram_repo.encrypt_token(data.access_token)

        account = await self.instagram_repo.create(
            db=db,
            workspace_id=workspace_id,
            data=payload,
        )
        await log_action(
            db=db,
            action="instagram_account.created",
            target_type="instagram_account",
            target_id=str(account.id),
            workspace_id=workspace_id,
            actor_user_id=current_user.id,
        )
        return self._to_response(account)

    async def list_accounts(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
    ) -> list[InstagramAccountResponse]:
        accounts = await self.instagram_repo.list_for_workspace(db=db, workspace_id=workspace_id)
        return [self._to_response(account) for account in accounts]

    async def get_account(
        self,
        db: AsyncSession,
        account_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> InstagramAccountResponse:
        account = await self.instagram_repo.get_by_id(
            db=db,
            account_id=account_id,
            workspace_id=workspace_id,
        )
        if account is None:
            raise AppException(
                code="instagram_account_not_found",
                message="Instagram account not found",
                status_code=404,
            )
        return self._to_response(account)

    async def update_account(
        self,
        db: AsyncSession,
        account_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: InstagramAccountUpdate,
    ) -> InstagramAccountResponse:
        update_payload = data.model_dump(exclude_unset=True)

        account = await self.instagram_repo.update(
            db=db,
            account_id=account_id,
            workspace_id=workspace_id,
            data=update_payload,
        )
        if account is None:
            raise AppException(
                code="instagram_account_not_found",
                message="Instagram account not found",
                status_code=404,
            )
        await log_action(
            db=db,
            action="instagram_account.updated",
            target_type="instagram_account",
            target_id=str(account.id),
            workspace_id=workspace_id,
        )
        return self._to_response(account)

    def _to_response(self, account: InstagramAccount) -> InstagramAccountResponse:
        return InstagramAccountResponse(
            id=account.id,
            workspace_id=account.workspace_id,
            instagram_username=account.instagram_username,
            page_name=account.page_name,
            is_active=account.is_active,
            auto_reply_enabled=account.auto_reply_enabled,
            reply_mode=account.reply_mode,
            confidence_threshold=account.confidence_threshold,
            last_synced_at=account.last_synced_at,
            created_at=account.created_at,
        )


def get_instagram_service() -> InstagramService:
    return InstagramService(instagram_repo=InstagramRepository())

import uuid
from collections.abc import Mapping

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decrypt_value, encrypt_value
from app.models.instagram_account import InstagramAccount


class InstagramRepository:
    def encrypt_token(self, token: str) -> str:
        return encrypt_value(token)

    def decrypt_token(self, encrypted: str) -> str:
        return decrypt_value(encrypted)

    async def create(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        data: Mapping[str, object],
    ) -> InstagramAccount:
        account = InstagramAccount(workspace_id=workspace_id, **dict(data))
        db.add(account)
        await db.flush()
        await db.refresh(account)
        return account

    async def get_by_id(
        self,
        db: AsyncSession,
        account_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> InstagramAccount | None:
        query = select(InstagramAccount).where(
            InstagramAccount.id == account_id,
            InstagramAccount.workspace_id == workspace_id,
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_instagram_id(
        self,
        db: AsyncSession,
        instagram_account_id: str,
    ) -> InstagramAccount | None:
        query = select(InstagramAccount).where(
            InstagramAccount.instagram_account_id == instagram_account_id,
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def list_for_workspace(
        self,
        db: AsyncSession,
        workspace_id: uuid.UUID,
    ) -> list[InstagramAccount]:
        query = (
            select(InstagramAccount)
            .where(InstagramAccount.workspace_id == workspace_id)
            .order_by(InstagramAccount.created_at.desc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def update(
        self,
        db: AsyncSession,
        account_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: Mapping[str, object],
    ) -> InstagramAccount | None:
        account = await self.get_by_id(db=db, account_id=account_id, workspace_id=workspace_id)
        if account is None:
            return None

        for key, value in dict(data).items():
            setattr(account, key, value)

        await db.flush()
        await db.refresh(account)
        return account

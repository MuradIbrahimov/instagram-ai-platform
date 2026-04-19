import base64
import hashlib
import uuid
from collections.abc import Mapping

from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.instagram_account import InstagramAccount


class InstagramRepository:
    def _fernet(self) -> Fernet:
        key_material = get_settings().encryption_key.encode("utf-8")
        digest = hashlib.sha256(key_material).digest()
        fernet_key = base64.urlsafe_b64encode(digest)
        return Fernet(fernet_key)

    def encrypt_token(self, token: str) -> str:
        return self._fernet().encrypt(token.encode("utf-8")).decode("utf-8")

    def decrypt_token(self, encrypted: str) -> str:
        return self._fernet().decrypt(encrypted.encode("utf-8")).decode("utf-8")

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

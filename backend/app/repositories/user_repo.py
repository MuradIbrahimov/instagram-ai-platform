import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    async def get_by_id(self, db: AsyncSession, user_id: uuid.UUID) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        email: str,
        password_hash: str,
        full_name: str,
    ) -> User:
        user = User(
            email=email.lower(),
            password_hash=password_hash,
            full_name=full_name,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def update_active(self, db: AsyncSession, user_id: uuid.UUID, is_active: bool) -> User | None:
        user = await self.get_by_id(db=db, user_id=user_id)
        if user is None:
            return None
        user.is_active = is_active
        await db.flush()
        await db.refresh(user)
        return user

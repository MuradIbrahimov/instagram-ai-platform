import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import TokenResponse, UserResponse


class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    async def register(
        self,
        db: AsyncSession,
        email: str,
        password: str,
        full_name: str,
    ) -> UserResponse:
        existing_user = await self.user_repo.get_by_email(db=db, email=email)
        if existing_user is not None:
            raise AppException(
                code="email_taken",
                message="Email is already registered",
                status_code=409,
            )

        user = await self.user_repo.create(
            db=db,
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
        )
        return self._to_user_response(user)

    async def login(self, db: AsyncSession, email: str, password: str) -> TokenResponse:
        user = await self.user_repo.get_by_email(db=db, email=email)
        if user is None or not verify_password(password, user.password_hash):
            raise AppException(
                code="invalid_credentials",
                message="Invalid email or password",
                status_code=401,
            )

        access_token = create_access_token(user_id=user.id, email=user.email)
        expires_in = get_settings().access_token_expire_minutes * 60
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in,
        )

    async def get_user_by_token(self, db: AsyncSession, token: str) -> User:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if not isinstance(subject, str):
            raise AppException(
                code="invalid_token",
                message="Token is invalid or expired",
                status_code=401,
            )

        try:
            user_id = uuid.UUID(subject)
        except ValueError as exc:
            raise AppException(
                code="invalid_token",
                message="Token is invalid or expired",
                status_code=401,
            ) from exc

        user = await self.user_repo.get_by_id(db=db, user_id=user_id)
        if user is None:
            raise AppException(
                code="invalid_token",
                message="Token is invalid or expired",
                status_code=401,
            )
        return user

    async def get_me(self, user: User) -> UserResponse:
        return self._to_user_response(user)

    def _to_user_response(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
        )


def get_auth_service() -> AuthService:
    return AuthService(user_repo=UserRepository())

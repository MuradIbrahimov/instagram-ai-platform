import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.logging import get_logger
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import TokenResponse, UserResponse
from app.services.audit_service import log_action

logger = get_logger(__name__)


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
        await log_action(
            db=db,
            action="user.registered",
            target_type="user",
            target_id=str(user.id),
        )
        return self._to_user_response(user)

    async def login(self, db: AsyncSession, email: str, password: str) -> TokenResponse:
        logger.info("auth.login_attempt", email=email)
        user = await self.user_repo.get_by_email(db=db, email=email)
        if user is None or not verify_password(password, user.password_hash):
            logger.warning("auth.login_failed", email=email, reason="invalid_credentials")
            raise AppException(
                code="invalid_credentials",
                message="Invalid email or password",
                status_code=401,
            )

        logger.info("auth.login_success", email=email, user_id=str(user.id))
        access_token = create_access_token(user_id=user.id, email=user.email)
        expires_in = get_settings().access_token_expire_minutes * 60
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in,
        )

    async def get_user_by_token(self, db: AsyncSession, token: str) -> User:
        logger.debug("auth.token_validation_start")
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if not isinstance(subject, str):
            logger.warning("auth.token_invalid", reason="bad_subject")
            raise AppException(
                code="invalid_token",
                message="Token is invalid or expired",
                status_code=401,
            )

        try:
            user_id = uuid.UUID(subject)
        except ValueError as exc:
            logger.warning("auth.token_invalid", reason="bad_uuid", subject=subject)
            raise AppException(
                code="invalid_token",
                message="Token is invalid or expired",
                status_code=401,
            ) from exc

        user = await self.user_repo.get_by_id(db=db, user_id=user_id)
        if user is None:
            logger.warning("auth.token_invalid", reason="user_not_found", user_id=str(user_id))
            raise AppException(
                code="invalid_token",
                message="Token is invalid or expired",
                status_code=401,
            )
        logger.debug("auth.token_valid", user_id=str(user.id), email=user.email)
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

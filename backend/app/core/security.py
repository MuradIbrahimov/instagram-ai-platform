import base64
import hashlib
from datetime import UTC, datetime, timedelta
from typing import Any
import uuid

from cryptography.fernet import Fernet, InvalidToken
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.exceptions import AppException

ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: uuid.UUID, email: str) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise AppException(
            code="invalid_token",
            message="Token is invalid or expired",
            status_code=401,
        ) from exc


def _get_fernet() -> Fernet:
    settings = get_settings()
    key_material = settings.encryption_key.encode("utf-8")
    digest = hashlib.sha256(key_material).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_value(plaintext: str) -> str:
    """Encrypt a plaintext string using the app's ENCRYPTION_KEY."""
    return _get_fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_value(ciphertext: str) -> str:
    """Decrypt a value encrypted by encrypt_value.

    Raises AppException(code='decryption_failed') if the ciphertext is invalid.
    """
    try:
        return _get_fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except (InvalidToken, Exception) as exc:
        raise AppException(
            code="decryption_failed",
            message="Failed to decrypt sensitive value",
            status_code=500,
        ) from exc

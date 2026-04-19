from sqlalchemy import Boolean, String, text
from sqlalchemy.orm import Mapped, relationship, mapped_column

from app.core.database import Base
from app.models.base import TimestampedModel, UUIDPrimaryKeyModel


class User(Base, UUIDPrimaryKeyModel, TimestampedModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    is_superuser: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))

    memberships = relationship("WorkspaceMembership", back_populates="user", cascade="all, delete-orphan")

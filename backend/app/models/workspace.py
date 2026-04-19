from sqlalchemy import Boolean, String, text
from sqlalchemy.orm import Mapped, relationship, mapped_column

from app.core.database import Base
from app.models.base import TimestampedModel, UUIDPrimaryKeyModel


class Workspace(Base, UUIDPrimaryKeyModel, TimestampedModel):
    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC", server_default=text("'UTC'"))
    auto_reply_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    memberships = relationship("WorkspaceMembership", back_populates="workspace", cascade="all, delete-orphan")

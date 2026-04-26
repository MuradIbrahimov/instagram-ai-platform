import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.membership import WorkspaceRole


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
        pattern=r"^[a-z0-9-]+$",
    )

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    @field_validator("slug", mode="before")
    @classmethod
    def strip_slug(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.strip().lower() or None
        return v


class WorkspaceResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    timezone: str
    auto_reply_enabled: bool
    created_at: datetime


class WorkspaceWithRoleResponse(WorkspaceResponse):
    role: WorkspaceRole

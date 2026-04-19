import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.membership import WorkspaceRole


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)


class WorkspaceResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    timezone: str
    auto_reply_enabled: bool
    created_at: datetime


class WorkspaceWithRoleResponse(WorkspaceResponse):
    role: WorkspaceRole

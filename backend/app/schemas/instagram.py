import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.instagram_account import ReplyMode


class InstagramAccountCreate(BaseModel):
    instagram_account_id: str = Field(min_length=1, max_length=128)
    instagram_username: str = Field(min_length=1, max_length=255)
    access_token: str | None = None


class InstagramAccountUpdate(BaseModel):
    is_active: bool | None = None
    auto_reply_enabled: bool | None = None
    reply_mode: ReplyMode | None = None
    confidence_threshold: float | None = Field(default=None, ge=0.0, le=1.0)
    business_hours_only: bool | None = None


class InstagramAccountResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    instagram_username: str
    page_name: str | None
    is_active: bool
    auto_reply_enabled: bool
    reply_mode: ReplyMode
    confidence_threshold: float
    last_synced_at: datetime | None
    created_at: datetime

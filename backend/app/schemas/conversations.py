import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.conversation import ConversationStatus


class ConversationResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    instagram_account_id: uuid.UUID
    customer_ig_user_id: str
    customer_username: str | None
    customer_display_name: str | None
    status: ConversationStatus
    assigned_user_id: uuid.UUID | None
    last_message_at: datetime | None
    last_inbound_at: datetime | None
    last_outbound_at: datetime | None
    unread_count: int
    ai_paused: bool
    created_at: datetime
    updated_at: datetime


class ConversationListItem(BaseModel):
    id: uuid.UUID
    customer_username: str | None
    customer_display_name: str | None
    status: ConversationStatus
    unread_count: int
    last_message_at: datetime | None
    ai_paused: bool
    assigned_user_id: uuid.UUID | None
    instagram_account_id: uuid.UUID


class ConversationFilters(BaseModel):
    status: ConversationStatus | None = None
    instagram_account_id: uuid.UUID | None = None
    assigned_user_id: uuid.UUID | None = None
    ai_paused: bool | None = None
    unread_only: bool | None = None
    search: str | None = None


class ConversationUpdate(BaseModel):
    status: ConversationStatus | None = None
    assigned_user_id: uuid.UUID | None = None


class AssignConversationRequest(BaseModel):
    user_id: uuid.UUID

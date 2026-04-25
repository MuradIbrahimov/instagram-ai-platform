// ─── Primitive Types ──────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ─── Workspaces ───────────────────────────────────────────────────────────────

export type WorkspaceRole = "owner" | "admin" | "agent" | "viewer";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  auto_reply_enabled: boolean;
  created_at: string;
}

export interface WorkspaceMembership {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

// ─── Instagram ────────────────────────────────────────────────────────────────

export type ReplyMode = "automatic" | "approval_required" | "human_only";

export interface InstagramAccount {
  id: string;
  workspace_id: string;
  instagram_username: string;
  page_name: string | null;
  is_active: boolean;
  auto_reply_enabled: boolean;
  reply_mode: ReplyMode;
  confidence_threshold: number;
  last_synced_at: string | null;
  created_at: string;
}

export interface CreateInstagramAccountData {
  instagram_account_id: string;
  instagram_username: string;
  access_token?: string;
  page_name?: string;
}

export interface UpdateInstagramAccountData {
  is_active?: boolean;
  auto_reply_enabled?: boolean;
  reply_mode?: ReplyMode;
  confidence_threshold?: number;
  business_hours_only?: boolean;
  access_token?: string;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export type ConversationStatus = "open" | "pending" | "closed" | "handoff";

export interface ConversationFilters {
  status?: ConversationStatus;
  instagram_account_id?: string;
  assigned_user_id?: string;
  ai_paused?: boolean;
  unread_only?: boolean;
  search?: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  instagram_account_id: string;
  customer_ig_user_id: string;
  customer_username: string | null;
  customer_display_name: string | null;
  status: ConversationStatus;
  assigned_user_id: string | null;
  last_message_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  unread_count: number;
  ai_paused: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationListItem {
  id: string;
  workspace_id: string;
  instagram_account_id: string;
  customer_username: string | null;
  customer_display_name: string | null;
  status: ConversationStatus;
  unread_count: number;
  last_message_at: string | null;
  ai_paused: boolean;
  assigned_user_id: string | null;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export type SenderType = "customer" | "ai" | "human" | "system";
export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "received" | "queued" | "sent" | "failed";
export type MessageType = "text" | "image" | "story_reply" | "attachment" | "system";

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  direction: MessageDirection;
  message_type: MessageType;
  text_content: string | null;
  status: MessageStatus;
  created_at: string;
}

// ─── Knowledge Base ───────────────────────────────────────────────────────────

export type KnowledgeSourceType = "upload" | "url" | "text";
export type KnowledgeDocumentStatus = "processing" | "ready" | "failed";

export interface KnowledgeDocument {
  id: string;
  workspace_id: string;
  title: string;
  source_type: KnowledgeSourceType;
  source_url: string | null;
  status: KnowledgeDocumentStatus;
  content_excerpt: string;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  workspace_id: string;
  content: string;
  chunk_index: number;
  token_count: number;
  created_at: string;
}

// ─── AI Runs ──────────────────────────────────────────────────────────────────

export type AiRunStatus = "queued" | "running" | "succeeded" | "failed";
export type AiDecision = "reply" | "handoff" | "skip";

export interface AiRun {
  id: string;
  workspace_id: string;
  conversation_id: string;
  message_id: string;
  prompt_version: string;
  status: AiRunStatus;
  decision: AiDecision | null;
  response_text: string | null;
  confidence_score: number | null;
  tokens_used: number | null;
  latency_ms: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

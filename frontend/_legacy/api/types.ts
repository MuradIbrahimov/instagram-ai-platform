export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  auto_reply_enabled: boolean;
  created_at: string;
}

export type WorkspaceRole = "owner" | "admin" | "agent" | "viewer";

export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface InstagramAccount {
  id: string;
  workspace_id: string;
  username: string;
  display_name: string;
  profile_picture_url: string | null;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationListItem {
  id: string;
  workspace_id: string;
  instagram_account_id: string;
  customer_handle: string;
  customer_name: string | null;
  last_message_preview: string;
  unread_count: number;
  last_message_at: string;
  status: "open" | "pending" | "resolved";
}

export interface Conversation {
  id: string;
  workspace_id: string;
  instagram_account_id: string;
  customer_handle: string;
  customer_name: string | null;
  status: "open" | "pending" | "resolved";
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "customer" | "agent" | "assistant";
  text: string;
  is_ai_generated: boolean;
  created_at: string;
}

export interface AIRun {
  id: string;
  workspace_id: string;
  conversation_id: string;
  prompt_version: string;
  status: "queued" | "running" | "succeeded" | "failed";
  response_text: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface KnowledgeDocument {
  id: string;
  workspace_id: string;
  title: string;
  source_type: "upload" | "url" | "text";
  status: "processing" | "ready" | "failed";
  content_excerpt: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentListItem {
  id: string;
  title: string;
  source_type: "upload" | "url" | "text";
  status: "processing" | "ready" | "failed";
  created_at: string;
}

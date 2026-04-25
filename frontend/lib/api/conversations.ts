import { api } from "@/lib/api";
import type {
  Conversation,
  ConversationFilters,
  ConversationListItem,
  ConversationStatus,
  Message,
} from "@/types/api";

// ─── Conversations ────────────────────────────────────────────────────────────

export function getConversations(
  workspaceId: string,
  filters: ConversationFilters,
  page = 1,
  pageSize = 20,
): Promise<ConversationListItem[]> {
  return api.get<ConversationListItem[]>(
    `/workspaces/${workspaceId}/conversations`,
    {
      ...(filters.status !== undefined && { status: filters.status }),
      ...(filters.instagram_account_id !== undefined && {
        instagram_account_id: filters.instagram_account_id,
      }),
      ...(filters.assigned_user_id !== undefined && {
        assigned_user_id: filters.assigned_user_id,
      }),
      ...(filters.ai_paused !== undefined && { ai_paused: filters.ai_paused }),
      ...(filters.unread_only !== undefined && {
        unread_only: filters.unread_only,
      }),
      ...(filters.search ? { search: filters.search } : {}),
      page,
      page_size: pageSize,
    },
  );
}

export function getConversation(
  workspaceId: string,
  conversationId: string,
): Promise<Conversation> {
  return api.get<Conversation>(
    `/workspaces/${workspaceId}/conversations/${conversationId}`,
  );
}

export interface UpdateConversationData {
  status?: ConversationStatus;
  assigned_user_id?: string | null;
}

export function updateConversation(
  workspaceId: string,
  conversationId: string,
  data: UpdateConversationData,
): Promise<Conversation> {
  return api.patch<Conversation>(
    `/workspaces/${workspaceId}/conversations/${conversationId}`,
    data,
  );
}

export function assignConversation(
  workspaceId: string,
  conversationId: string,
  userId: string,
): Promise<Conversation> {
  return api.post<Conversation>(
    `/workspaces/${workspaceId}/conversations/${conversationId}/assign`,
    { user_id: userId },
  );
}

export function pauseAI(
  workspaceId: string,
  conversationId: string,
): Promise<Conversation> {
  return api.post<Conversation>(
    `/workspaces/${workspaceId}/conversations/${conversationId}/pause-ai`,
  );
}

export function resumeAI(
  workspaceId: string,
  conversationId: string,
): Promise<Conversation> {
  return api.post<Conversation>(
    `/workspaces/${workspaceId}/conversations/${conversationId}/resume-ai`,
  );
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function getMessages(
  workspaceId: string,
  conversationId: string,
  page = 1,
  pageSize = 50,
): Promise<Message[]> {
  return api.get<Message[]>(
    `/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
    { page, page_size: pageSize },
  );
}

export function sendMessage(
  workspaceId: string,
  conversationId: string,
  textContent: string,
): Promise<Message> {
  return api.post<Message>(
    `/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
    { text_content: textContent, message_type: "text" },
  );
}

import { api } from "@/lib/api";
import type { Message } from "@/types/api";

export function approveMessage(
  workspaceId: string,
  conversationId: string,
  messageId: string,
): Promise<Message> {
  return api.post<Message>(
    `/workspaces/${workspaceId}/conversations/${conversationId}/messages/${messageId}/approve`,
  );
}

export function rejectMessage(
  workspaceId: string,
  conversationId: string,
  messageId: string,
): Promise<Message> {
  return api.post<Message>(
    `/workspaces/${workspaceId}/conversations/${conversationId}/messages/${messageId}/reject`,
  );
}

"use client";

import { useEffect } from "react";
import { queryClient } from "@/lib/query-client";
import { conversationKeys } from "@/hooks/use-conversations";
import type { Conversation, SenderType } from "@/types/api";

interface AiRunIndicatorProps {
  conversation: Conversation;
  lastMessageDirection: "inbound" | "outbound" | null;
  lastMessageSenderType: SenderType | null;
}

export function AiRunIndicator({
  conversation,
  lastMessageDirection,
  lastMessageSenderType,
}: AiRunIndicatorProps) {
  const workspaceId = conversation.workspace_id;

  const shouldShow =
    !conversation.ai_paused &&
    conversation.status !== "closed" &&
    conversation.status !== "handoff" &&
    lastMessageDirection === "inbound" &&
    lastMessageSenderType === "customer";

  // Poll messages and conversation every 3s while waiting for AI reply
  useEffect(() => {
    if (!shouldShow) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(workspaceId, conversation.id),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(workspaceId, conversation.id),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [shouldShow, workspaceId, conversation.id]);

  if (!shouldShow) return null;

  return (
    <div className="flex items-start gap-2 px-4 pb-1">
      <div
        className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full animate-bounce"
            style={{
              background: "var(--color-foreground-muted)",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
        <span
          className="text-xs ml-1"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          AI is thinking…
        </span>
      </div>
    </div>
  );
}

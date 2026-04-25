"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useConversation } from "@/hooks/use-conversations";
import { useConversationStore } from "@/stores/conversation-store";
import { MessageThread } from "@/components/conversations/message-thread";
import { EmptyThread } from "@/components/conversations/empty-thread";
import { FullPageSpinner } from "@/components/shared/loading-spinner";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const setActiveConversation = useConversationStore(
    (s) => s.setActiveConversation,
  );

  // Sync active conversation ID into the store (for list highlight + mobile nav)
  useEffect(() => {
    setActiveConversation(conversationId ?? null);
    return () => {
      // On unmount (navigating away), keep active so list stays highlighted
      // until user explicitly navigates back
    };
  }, [conversationId, setActiveConversation]);

  const { data: conversation, isLoading, isError } = useConversation(
    conversationId ?? null,
  );

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p
          className="text-sm"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          Conversation not found
        </p>
      </div>
    );
  }

  return (
    <MessageThread
      conversation={conversation}
      // Show back button on mobile
      showBackButton
    />
  );
}

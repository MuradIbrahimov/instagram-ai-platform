"use client";

import { useEffect, Suspense, lazy } from "react";
import { useParams } from "next/navigation";
import { useConversation, useMessages } from "@/hooks/use-conversations";
import { useConversationStore } from "@/stores/conversation-store";
import { MessageThread } from "@/components/conversations/message-thread";
import { EmptyThread } from "@/components/conversations/empty-thread";
import { FullPageSpinner } from "@/components/shared/loading-spinner";

const ConversationInsights = lazy(() =>
  import("@/components/conversations/conversation-insights").then((m) => ({
    default: m.ConversationInsights,
  })),
);

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const setActiveConversation = useConversationStore(
    (s) => s.setActiveConversation,
  );
  const insightsOpen = useConversationStore((s) => s.insightsOpen);
  const toggleInsights = useConversationStore((s) => s.toggleInsights);

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

  // Fetch messages for insights panel
  const { data: messagesData } = useMessages(conversationId ?? "");

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
    <div className="flex flex-row h-full min-h-0 flex-1">
      <div className="flex-1 min-w-0">
        <MessageThread
          conversation={conversation}
          // Show back button on mobile
          showBackButton
        />
      </div>

      {insightsOpen && (
        <Suspense fallback={<div className="w-72 shrink-0" />}>
          <ConversationInsights
            conversation={conversation}
            messages={(messagesData?.pages ?? []).flat()}
            onClose={toggleInsights}
          />
        </Suspense>
      )}
    </div>
  );
}

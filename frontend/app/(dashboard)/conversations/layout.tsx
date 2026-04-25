"use client";

import { useConversationStore } from "@/stores/conversation-store";
import { ConversationList } from "@/components/conversations/conversation-list";
import { cn } from "@/lib/utils";

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeId = useConversationStore((s) => s.activeConversationId);

  return (
    <div className="h-full min-h-0 overflow-hidden flex md:grid md:[grid-template-columns:360px_1fr]">
      {/* Conversation list — hidden on mobile when a thread is open */}
      <div
        className={cn(
          "flex-col border-r min-w-0 overflow-hidden",
          // Mobile: show list only when no active conversation
          activeId ? "hidden md:flex" : "flex",
          // Desktop: always show
          "md:flex",
        )}
        style={{ borderColor: "var(--color-border)" }}
      >
        <ConversationList />
      </div>

      {/* Thread / right panel — hidden on mobile when no active conversation */}
      <div
        className={cn(
          "flex-col min-w-0 overflow-hidden flex-1",
          // Mobile: show thread only when active
          activeId ? "flex" : "hidden md:flex",
          "md:flex",
        )}
      >
        {children}
      </div>
    </div>
  );
}

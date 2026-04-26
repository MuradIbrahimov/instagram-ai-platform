"use client";

import { useEffect, useMemo, useRef } from "react";
import { isSameDay, format } from "date-fns";
import { useMessages, useSendMessage } from "@/hooks/use-conversations";
import { useAuthStore } from "@/stores/auth-store";
import { MessageBubble, DateDivider } from "./message-bubble";
import { ReplyBox } from "./reply-box";
import { ConversationHeader } from "./conversation-header";
import { AiRunIndicator } from "./ai-run-indicator";
import { FullPageSpinner } from "@/components/shared/loading-spinner";
import type { Conversation, Message, SenderType } from "@/types/api";

// ─── Date label helper ────────────────────────────────────────────────────────

function getDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

// ─── Grouped message list ─────────────────────────────────────────────────────

interface MessageGroup {
  dateLabel: string;
  messages: Message[];
}

function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let lastLabel: string | null = null;

  for (const msg of messages) {
    const label = getDateLabel(new Date(msg.created_at));
    if (label !== lastLabel) {
      groups.push({ dateLabel: label, messages: [] });
      lastLabel = label;
    }
    groups[groups.length - 1].messages.push(msg);
  }

  return groups;
}

// ─── MessageThread ────────────────────────────────────────────────────────────

interface MessageThreadProps {
  conversation: Conversation;
  showBackButton?: boolean;
}

export function MessageThread({
  conversation,
  showBackButton = false,
}: MessageThreadProps) {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMessages(conversation.id);

  const sendMutation = useSendMessage();

  // Auto-load all available pages (ASC ordering: page 1 = oldest)
  // so the full history is loaded before scrolling to bottom
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten and deduplicate all pages (optimistic messages may duplicate on refetch)
  const allMessages = useMemo(() => {
    const seen = new Set<string>();
    const flat: Message[] = [];
    for (const page of data?.pages ?? []) {
      for (const msg of page) {
        if (!seen.has(msg.id)) {
          seen.add(msg.id);
          flat.push(msg);
        }
      }
    }
    return flat;
  }, [data]);

  const groups = useMemo(() => groupMessagesByDate(allMessages), [allMessages]);

  // Scroll to bottom when messages first load (or finish auto-loading)
  useEffect(() => {
    if (!hasNextPage && !isFetchingNextPage && allMessages.length > 0) {
      const el = scrollRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
        isAtBottomRef.current = true;
      }
    }
  }, [hasNextPage, isFetchingNextPage, allMessages.length]);

  // Scroll to bottom when a new optimistic message is added
  const prevLengthRef = useRef(allMessages.length);
  useEffect(() => {
    const grew = allMessages.length > prevLengthRef.current;
    prevLengthRef.current = allMessages.length;
    if (grew && isAtBottomRef.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [allMessages.length]);

  // Track whether user is near bottom
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distFromBottom < 60;
  }

  // Retry failed message
  function handleRetry(message: Message) {
    if (!message.text_content) return;
    sendMutation.mutate({
      workspaceId,
      conversationId: conversation.id,
      text: message.text_content,
    });
  }

  // Show AI run indicator when last message is inbound from customer
  const lastMessage = allMessages[allMessages.length - 1];
  const lastMessageDirection = lastMessage?.direction ?? null;
  const lastMessageSenderType = (lastMessage?.sender_type ?? null) as SenderType | null;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <ConversationHeader
          conversation={conversation}
          showBackButton={showBackButton}
        />
        <div className="flex-1 flex items-center justify-center">
          <FullPageSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <ConversationHeader
        conversation={conversation}
        showBackButton={showBackButton}
      />

      {/* Scrollable message list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-1 min-h-0"
        style={{ background: "var(--color-background)" }}
      >
        {/* Loading older pages indicator (top) */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-3">
            <span
              className="size-4 rounded-full border-2 animate-spin"
              style={{
                borderColor: "var(--color-border)",
                borderTopColor: "var(--color-accent)",
              }}
            />
          </div>
        )}

        {/* Empty state */}
        {allMessages.length === 0 && !isFetchingNextPage && (
          <div className="flex justify-center py-12">
            <p
              className="text-sm"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              No messages yet
            </p>
          </div>
        )}

        {/* Message groups */}
        {groups.map((group) => (
          <div key={group.dateLabel}>
            <DateDivider label={group.dateLabel} />
            <div className="space-y-1.5">
              {group.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onRetry={handleRetry}
                  conversationId={conversation.id}
                  conversationStatus={conversation.status}
                />
              ))}
            </div>
          </div>
        ))}

        {/* AI run indicator */}
        <AiRunIndicator
          conversation={conversation}
          lastMessageDirection={lastMessageDirection}
          lastMessageSenderType={lastMessageSenderType}
        />
      </div>

      {/* Reply box */}
      <ReplyBox conversation={conversation} />
    </div>
  );
}

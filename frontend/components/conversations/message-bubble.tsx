"use client";

import { memo, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle,
  Clock,
  RotateCcw,
  X as XIcon,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { useApproveMessage, useRejectMessage } from "@/hooks/use-message-actions";
import type { ConversationStatus, Message } from "@/types/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Status Icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: Message["status"] }) {
  if (status === "queued") {
    return (
      <Clock
        className="size-3"
        style={{ color: "var(--color-foreground-muted)" }}
      />
    );
  }
  if (status === "sent" || status === "received") {
    return (
      <Check
        className="size-3"
        style={{ color: "var(--color-success)" }}
      />
    );
  }
  if (status === "failed") {
    return (
      <XIcon
        className="size-3"
        style={{ color: "var(--color-danger)" }}
      />
    );
  }
  return null;
}

// ─── Pending Approval Buttons ─────────────────────────────────────────────────

interface ApprovalActionsProps {
  message: Message;
  conversationId: string;
}

function ApprovalActions({ message, conversationId }: ApprovalActionsProps) {
  const approveMutation = useApproveMessage();
  const rejectMutation = useRejectMessage();
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isPending) approveMutation.mutate({ conversationId, messageId: message.id });
        }}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "color-mix(in srgb, #22c55e 15%, transparent)",
          color: "#22c55e",
          border: "1px solid color-mix(in srgb, #22c55e 30%, transparent)",
        }}
      >
        {approveMutation.isPending ? (
          <span
            className="size-3 rounded-full border-2 animate-spin"
            style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
          />
        ) : (
          <CheckCircle className="size-3" />
        )}
        Send Reply
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isPending) rejectMutation.mutate({ conversationId, messageId: message.id });
        }}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "transparent",
          color: "var(--color-danger)",
          border: "1px solid color-mix(in srgb, var(--color-danger) 35%, transparent)",
        }}
      >
        {rejectMutation.isPending ? (
          <span
            className="size-3 rounded-full border-2 animate-spin"
            style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
          />
        ) : (
          <XIcon className="size-3" />
        )}
        Discard
      </button>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  onRetry?: (message: Message) => void;
  conversationId?: string;
  conversationStatus?: ConversationStatus;
}

export const MessageBubble = memo(function MessageBubble({ message, onRetry, conversationId, conversationStatus }: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);

  const isSystem =
    message.message_type === "system" || message.sender_type === "system";
  const isInbound = message.direction === "inbound";
  const isAI = message.sender_type === "ai";
  const isStoryReply = message.message_type === "story_reply";
  const isFailed = message.status === "failed";

  // ── System message ──
  if (isSystem) {
    const text = message.text_content ?? "";
    const isEscalation = /escalat/i.test(text);
    if (isEscalation) {
      return (
        <div className="flex items-center justify-center gap-2 py-1.5 px-4">
          <AlertTriangle className="size-3.5 shrink-0" style={{ color: "#f59e0b" }} />
          <span className="text-xs font-medium text-center" style={{ color: "#f59e0b" }}>
            {text || "AI escalated this conversation · Confidence too low"}
          </span>
        </div>
      );
    }
    return (
      <div className="flex justify-center py-1 px-4">
        <span
          className="text-xs italic"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          {text}
        </span>
      </div>
    );
  }

  const isRight = !isInbound;

  // Pending AI draft awaiting approval
  const isPendingApproval = isAI && isRight && message.status === "queued";
  const canApprove =
    isPendingApproval &&
    !!conversationId &&
    conversationStatus !== "closed" &&
    conversationStatus !== "handoff";

  // Bubble colors
  const bubbleStyle: React.CSSProperties = isInbound
    ? {
        background: "var(--color-surface)",
        color: "var(--color-foreground)",
        border: "1px solid var(--color-border)",
      }
    : isPendingApproval
      ? {
          background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))",
          color: "var(--color-foreground)",
          border: "2px dashed color-mix(in srgb, var(--color-accent) 45%, transparent)",
        }
      : isAI
        ? {
            background:
              "color-mix(in srgb, var(--color-accent) 20%, var(--color-surface))",
            color: "var(--color-foreground)",
            border:
              "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }
        : {
            background:
              "color-mix(in srgb, #3b82f6 18%, var(--color-surface))",
            color: "var(--color-foreground)",
            border:
              "1px solid color-mix(in srgb, #3b82f6 30%, transparent)",
          };

  return (
    <Tooltip.Provider delayDuration={600}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className={cn(
              "group flex gap-2 px-4",
              isRight ? "justify-end" : "justify-start",
            )}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div
              className={cn(
                "flex flex-col gap-1 max-w-[72%]",
                isRight ? "items-end" : "items-start",
              )}
            >
              {/* AI Draft label (pending approval) */}
              {isPendingApproval && (
                <span
                  className="self-end text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm"
                  style={{
                    color: "#f59e0b",
                    background: "color-mix(in srgb, #f59e0b 12%, transparent)",
                    border: "1px solid color-mix(in srgb, #f59e0b 25%, transparent)",
                    letterSpacing: "0.08em",
                  }}
                >
                  AI Draft
                </span>
              )}

              {/* Story reply indicator */}
              {isStoryReply && (
                <div
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md"
                  style={{
                    color: "var(--color-foreground-muted)",
                    background:
                      "color-mix(in srgb, var(--color-border) 50%, transparent)",
                  }}
                >
                  <Camera className="size-3" />
                  Replied to a story
                </div>
              )}

              {/* Bubble */}
              <div
                className="rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words"
                style={bubbleStyle}
              >
                {message.text_content ?? ""}
              </div>

              {/* Sender label + status (outbound, non-draft) */}
              {isRight && !isPendingApproval && (
                <div
                  className="flex items-center gap-1 px-1"
                  style={{ color: "var(--color-foreground-muted)" }}
                >
                  <span className="text-[10px]">
                    {isAI ? "AI" : "You"}
                  </span>
                  <StatusIcon status={message.status} />
                  {isFailed && onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(message)}
                      className="flex items-center gap-0.5 text-[10px] underline underline-offset-2 ml-1"
                      style={{ color: "var(--color-danger)" }}
                    >
                      <RotateCcw className="size-3" />
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Approval actions */}
              {canApprove && (
                <ApprovalActions message={message} conversationId={conversationId} />
              )}
            </div>
          </div>
        </Tooltip.Trigger>

        {/* Timestamp tooltip */}
        <Tooltip.Portal>
          <Tooltip.Content
            side={isRight ? "left" : "right"}
            sideOffset={8}
            className="px-2 py-1 text-xs rounded-md shadow-md z-50"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground-muted)",
            }}
          >
            {formatTimestamp(message.created_at)}
            <Tooltip.Arrow style={{ fill: "var(--color-border)" }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
});

// ─── Date Divider ─────────────────────────────────────────────────────────────

export function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
      <span
        className="text-[11px] font-medium shrink-0"
        style={{ color: "var(--color-foreground-muted)" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 px-4">
      <div
        className="flex items-center gap-1 rounded-2xl px-3.5 py-2.5"
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
      </div>
    </div>
  );
}

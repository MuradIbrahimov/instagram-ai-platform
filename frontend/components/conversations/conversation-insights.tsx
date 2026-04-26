"use client";

import { X } from "lucide-react";
import type { Conversation, Message } from "@/types/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── ConversationInsights ─────────────────────────────────────────────────────

interface ConversationInsightsProps {
  conversation: Conversation;
  messages: Message[];
  onClose: () => void;
}

export function ConversationInsights({
  conversation,
  messages,
  onClose,
}: ConversationInsightsProps) {
  const aiMessages = messages.filter((m) => m.sender_type === "ai");
  const escalationCount = messages.filter(
    (m) =>
      (m.message_type === "system" || m.sender_type === "system") &&
      /escalat/i.test(m.text_content ?? ""),
  ).length;
  const recentAiMessages = [...aiMessages]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background: "var(--color-surface)",
        borderLeft: "1px solid var(--color-border)",
        width: "300px",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--color-foreground)" }}
        >
          Insights
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center size-6 rounded-md transition-colors"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* Customer info */}
        <section className="flex flex-col gap-2">
          <h3
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            Customer
          </h3>
          <div className="flex flex-col gap-1">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              @{conversation.customer_username ?? "Unknown"}
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              First seen {formatDate(conversation.created_at)}
            </p>
          </div>
        </section>

        {/* Conversation status */}
        <section className="flex flex-col gap-2">
          <h3
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            Status
          </h3>
          <div className="flex flex-col gap-1">
            <span
              className="text-xs capitalize px-2 py-0.5 rounded-full self-start font-medium"
              style={{
                background:
                  conversation.status === "open"
                    ? "color-mix(in srgb, var(--color-accent) 15%, transparent)"
                    : conversation.status === "handoff"
                      ? "color-mix(in srgb, var(--color-danger) 15%, transparent)"
                      : conversation.status === "closed"
                        ? "color-mix(in srgb, var(--color-foreground-muted) 15%, transparent)"
                        : "color-mix(in srgb, var(--color-warning) 15%, transparent)",
                color:
                  conversation.status === "open"
                    ? "var(--color-accent)"
                    : conversation.status === "handoff"
                      ? "var(--color-danger)"
                      : conversation.status === "closed"
                        ? "var(--color-foreground-muted)"
                        : "var(--color-warning)",
              }}
            >
              {conversation.status}
            </span>
            <p
              className="text-xs"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              AI {conversation.ai_paused ? "paused" : "active"}
            </p>
          </div>
        </section>

        {/* AI Stats */}
        <section className="flex flex-col gap-2">
          <h3
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            AI Activity
          </h3>
          <div
            className="grid grid-cols-2 gap-2 rounded-lg p-3"
            style={{
              background:
                "color-mix(in srgb, var(--color-border) 40%, var(--color-background))",
            }}
          >
            <div className="flex flex-col gap-0.5">
              <span
                className="text-lg font-bold"
                style={{ color: "var(--color-foreground)" }}
              >
                {aiMessages.length}
              </span>
              <span
                className="text-[10px]"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                AI replies
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span
                className="text-lg font-bold"
                style={{
                  color: escalationCount > 0 ? "var(--color-danger)" : "var(--color-foreground)",
                }}
              >
                {escalationCount}
              </span>
              <span
                className="text-[10px]"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                escalations
              </span>
            </div>
          </div>
        </section>

        {/* Recent AI messages */}
        {recentAiMessages.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              Recent AI Replies
            </h3>
            <div className="flex flex-col gap-2">
              {recentAiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex flex-col gap-1 rounded-lg p-2.5"
                  style={{
                    background:
                      "color-mix(in srgb, var(--color-border) 30%, var(--color-background))",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <p
                    className="text-xs line-clamp-2"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {msg.text_content ?? ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] capitalize"
                      style={{
                        color:
                          msg.status === "sent" || msg.status === "received"
                            ? "var(--color-success)"
                            : msg.status === "failed"
                              ? "var(--color-danger)"
                              : "var(--color-foreground-muted)",
                      }}
                    >
                      {msg.status}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--color-foreground-muted)" }}
                    >
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}

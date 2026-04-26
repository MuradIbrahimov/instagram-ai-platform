"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/types/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#6c63ff",
  "#f59e0b",
  "#22c55e",
  "#ec4899",
  "#f97316",
  "#06b6d4",
  "#8b5cf6",
];

function usernameColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diffMs / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (secs < 60) return "now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ConversationListItemProps {
  item: ConversationListItem;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationListItemCard = memo(function ConversationListItemCard({
  item,
  isActive,
  onClick,
}: ConversationListItemProps) {
  const username = item.customer_username ?? "Unknown";
  const displayName = item.customer_display_name ?? username;
  const color = usernameColor(username);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-3 px-4 py-3 relative",
        "transition-colors duration-100",
        "border-l-2",
        isActive ? "" : "border-transparent hover:bg-white/[0.04]",
      )}
      style={
        isActive
          ? {
              borderLeftColor: "var(--color-accent)",
              background:
                "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))",
            }
          : undefined
      }
    >
      {/* Avatar */}
      <div
        className="size-10 shrink-0 rounded-full flex items-center justify-center text-white font-semibold text-sm select-none"
        style={{ background: color }}
        aria-hidden
      >
        {username.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          {/* Name */}
          <span
            className={cn(
              "text-sm font-semibold truncate",
              item.unread_count > 0 ? "" : "font-medium",
            )}
            style={{
              color:
                item.unread_count > 0
                  ? "var(--color-foreground)"
                  : "var(--color-foreground-muted)",
            }}
          >
            @{username}
          </span>
          {/* Time */}
          <span
            className="text-xs shrink-0"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            {timeAgo(item.last_message_at)}
          </span>
        </div>

        {/* Display name */}
        {displayName !== username && (
          <p
            className="text-xs truncate"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            {displayName}
          </p>
        )}

        {/* Bottom row: status + unread + ai paused */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <ConversationStatusBadge status={item.status} />

          <div className="flex items-center gap-1.5">
            {/* AI paused dot */}
            {item.ai_paused && (
              <span
                title="AI paused"
                className="size-2 rounded-full shrink-0"
                style={{ background: "var(--color-warning)" }}
              />
            )}
            {/* Unread badge */}
            {item.unread_count > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white px-1"
                style={{ background: "var(--color-accent)" }}
              >
                {item.unread_count > 99 ? "99+" : item.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
});

// ─── Inline status badge (small) ─────────────────────────────────────────────

const STATUS_CONFIG = {
  open: { label: "Open", color: "#6366f1", bg: "color-mix(in srgb, #6366f1 15%, transparent)" },
  pending: { label: "Pending", color: "var(--color-warning)", bg: "color-mix(in srgb, var(--color-warning) 15%, transparent)" },
  handoff: { label: "Handoff", color: "var(--color-danger)", bg: "color-mix(in srgb, var(--color-danger) 15%, transparent)" },
  closed: { label: "Closed", color: "#64748b", bg: "color-mix(in srgb, #64748b 15%, transparent)" },
} as const;

type ConversationStatus = keyof typeof STATUS_CONFIG;

function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-badge"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ConversationListItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div
        className="size-10 rounded-full shrink-0"
        style={{ background: "var(--color-border)" }}
      />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex justify-between">
          <div
            className="h-3.5 w-28 rounded"
            style={{ background: "var(--color-border)" }}
          />
          <div
            className="h-3 w-8 rounded"
            style={{ background: "var(--color-border)" }}
          />
        </div>
        <div
          className="h-3 w-40 rounded"
          style={{ background: "var(--color-border)" }}
        />
        <div
          className="h-3 w-16 rounded"
          style={{ background: "var(--color-border)" }}
        />
      </div>
    </div>
  );
}

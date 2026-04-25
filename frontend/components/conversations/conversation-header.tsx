"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, UserPlus } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { usePauseAI, useResumeAI, useUpdateConversation } from "@/hooks/use-conversations";
import { useAuthStore } from "@/stores/auth-store";
import { useConversationStore } from "@/stores/conversation-store";
import type { Conversation, ConversationStatus } from "@/types/api";

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

const STATUS_OPTIONS: { value: ConversationStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "handoff", label: "Handoff" },
  { value: "closed", label: "Closed" },
];

const STATUS_COLORS: Record<ConversationStatus, string> = {
  open: "#6366f1",
  pending: "var(--color-warning)",
  handoff: "var(--color-danger)",
  closed: "#64748b",
};

// ─── ConversationHeader ────────────────────────────────────────────────────────

interface ConversationHeaderProps {
  conversation: Conversation;
  showBackButton?: boolean;
}

export function ConversationHeader({
  conversation,
  showBackButton = false,
}: ConversationHeaderProps) {
  const router = useRouter();
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");
  const setActiveConversation = useConversationStore(
    (s) => s.setActiveConversation,
  );

  const pauseMutation = usePauseAI();
  const resumeMutation = useResumeAI();
  const updateMutation = useUpdateConversation();

  const username = conversation.customer_username ?? "Unknown";
  const displayName = conversation.customer_display_name;
  const color = usernameColor(username);
  const isAiActive = !conversation.ai_paused;

  function handleBack() {
    setActiveConversation(null);
    router.push("/conversations");
  }

  function handlePauseResume() {
    if (isAiActive) {
      pauseMutation.mutate({ workspaceId, conversationId: conversation.id });
    } else {
      resumeMutation.mutate({ workspaceId, conversationId: conversation.id });
    }
  }

  function handleStatusChange(status: ConversationStatus) {
    updateMutation.mutate({
      workspaceId,
      conversationId: conversation.id,
      data: { status },
    });
  }

  const isAiLoading = pauseMutation.isPending || resumeMutation.isPending;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Back button (mobile) */}
      {showBackButton && (
        <button
          type="button"
          onClick={handleBack}
          className="p-1.5 rounded-md transition-hover hover:bg-white/5 shrink-0"
          style={{ color: "var(--color-foreground-muted)" }}
          aria-label="Back to list"
        >
          <ArrowLeft className="size-4" />
        </button>
      )}

      {/* Avatar */}
      <div
        className="size-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 select-none"
        style={{ background: color }}
        aria-hidden
      >
        {username.charAt(0).toUpperCase()}
      </div>

      {/* Identity */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: "var(--color-foreground)" }}
        >
          @{username}
        </p>
        {displayName && displayName !== username && (
          <p
            className="text-xs truncate"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            {displayName}
          </p>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* AI Pause/Resume */}
        <button
          type="button"
          onClick={handlePauseResume}
          disabled={isAiLoading}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium",
            "transition-hover disabled:opacity-60",
          )}
          style={
            isAiActive
              ? {
                  background:
                    "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                  color: "var(--color-accent)",
                  border:
                    "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                }
              : {
                  background:
                    "color-mix(in srgb, var(--color-warning) 12%, transparent)",
                  color: "var(--color-warning)",
                  border:
                    "1px solid color-mix(in srgb, var(--color-warning) 25%, transparent)",
                }
          }
          title={isAiActive ? "Pause AI" : "Resume AI"}
        >
          {isAiLoading ? (
            <span
              className="size-3 rounded-full border animate-spin"
              style={{
                borderColor: "currentColor",
                borderTopColor: "transparent",
              }}
            />
          ) : (
            <span
              className="size-1.5 rounded-full"
              style={{
                background: isAiActive
                  ? "var(--color-accent)"
                  : "var(--color-warning)",
              }}
            />
          )}
          {isAiActive ? "AI active" : "AI paused"}
        </button>

        {/* Status dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium",
                "transition-hover",
              )}
              style={{
                background:
                  "color-mix(in srgb, var(--color-border) 50%, transparent)",
                color: STATUS_COLORS[conversation.status],
                border: "1px solid var(--color-border)",
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: STATUS_COLORS[conversation.status] }}
              />
              {conversation.status.charAt(0).toUpperCase() +
                conversation.status.slice(1)}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-50 min-w-[120px] rounded-md border py-1 shadow-lg"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenu.Item
                  key={opt.value}
                  onSelect={() => handleStatusChange(opt.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer outline-none",
                    "transition-colors hover:bg-white/5",
                    conversation.status === opt.value && "opacity-40",
                  )}
                  style={{ color: STATUS_COLORS[opt.value] }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: STATUS_COLORS[opt.value] }}
                  />
                  {opt.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Assign button (placeholder) */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-hover hover:bg-white/5"
          style={{
            color: "var(--color-foreground-muted)",
            border: "1px solid var(--color-border)",
          }}
          title="Assign conversation"
        >
          <UserPlus className="size-3.5" />
          Unassigned
        </button>

        {/* More menu (placeholder) */}
        <button
          type="button"
          className="p-1.5 rounded-md transition-hover hover:bg-white/5"
          style={{ color: "var(--color-foreground-muted)" }}
          aria-label="More actions"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>
    </div>
  );
}

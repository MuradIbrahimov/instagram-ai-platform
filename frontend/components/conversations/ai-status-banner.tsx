"use client";

import { useState } from "react";
import { Bot, Info, Pause, Play } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { toast } from "sonner";
import { useAccount } from "@/hooks/use-instagram";
import { usePauseAI, useResumeAI } from "@/hooks/use-conversations";
import { queryClient } from "@/lib/query-client";
import { updateConversation, resumeAI } from "@/lib/api/conversations";
import { conversationKeys } from "@/hooks/use-conversations";
import type { Conversation } from "@/types/api";

interface AiStatusBannerProps {
  conversation: Conversation;
  workspaceId: string;
}

export function AiStatusBanner({ conversation, workspaceId }: AiStatusBannerProps) {
  const [resolving, setResolving] = useState(false);

  const { data: account } = useAccount(workspaceId, conversation.instagram_account_id);
  const pauseAIMutation = usePauseAI();
  const resumeAIMutation = useResumeAI();

  const replyMode = account?.reply_mode ?? "automatic";
  const { ai_paused, status } = conversation;

  // human_only: no banner — agent just types freely
  if (replyMode === "human_only") return null;

  // ── Handoff ──────────────────────────────────────────────────────────────────
  if (status === "handoff") {
    async function handleMarkResolved() {
      if (resolving) return;
      setResolving(true);
      try {
        await updateConversation(workspaceId, conversation.id, { status: "open" });
        await resumeAI(workspaceId, conversation.id);
        await queryClient.invalidateQueries({
          queryKey: conversationKeys.detail(workspaceId, conversation.id),
        });
        toast.success("Conversation resolved and AI resumed");
      } catch {
        toast.error("Failed to resolve conversation");
        await queryClient.invalidateQueries({
          queryKey: conversationKeys.detail(workspaceId, conversation.id),
        });
      } finally {
        setResolving(false);
      }
    }

    return (
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{
          background:
            "color-mix(in srgb, var(--color-danger) 10%, var(--color-surface))",
          borderTop: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)",
        }}
      >
        <span
          className="size-2 rounded-full shrink-0 animate-pulse"
          style={{ background: "var(--color-danger)" }}
        />
        <span
          className="text-xs font-medium flex-1"
          style={{ color: "var(--color-danger)" }}
        >
          AI escalated · Human review needed
        </span>
        <button
          type="button"
          onClick={handleMarkResolved}
          disabled={resolving}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "color-mix(in srgb, var(--color-danger) 15%, transparent)",
            color: "var(--color-danger)",
            border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)",
          }}
        >
          {resolving ? (
            <span
              className="size-3 rounded-full border-2 animate-spin"
              style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
            />
          ) : (
            <Play className="size-3" />
          )}
          Mark as Resolved
        </button>
      </div>
    );
  }

  // ── AI paused ─────────────────────────────────────────────────────────────────
  if (ai_paused) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{
          background:
            "color-mix(in srgb, var(--color-foreground-muted) 7%, var(--color-surface))",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <Bot className="size-3.5 shrink-0" style={{ color: "var(--color-foreground-muted)" }} />
        <span className="text-xs flex-1" style={{ color: "var(--color-foreground-muted)" }}>
          AI is paused · You're in control
        </span>
        <button
          type="button"
          onClick={() =>
            resumeAIMutation.mutate({ workspaceId, conversationId: conversation.id })
          }
          disabled={resumeAIMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:
              "color-mix(in srgb, var(--color-accent) 12%, transparent)",
            color: "var(--color-accent)",
            border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
          }}
        >
          {resumeAIMutation.isPending ? (
            <span
              className="size-3 rounded-full border-2 animate-spin"
              style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
            />
          ) : (
            <Play className="size-3" />
          )}
          Resume AI
        </button>
      </div>
    );
  }

  // ── Approval required ─────────────────────────────────────────────────────────
  if (replyMode === "approval_required") {
    return (
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{
          background:
            "color-mix(in srgb, var(--color-warning) 10%, var(--color-surface))",
          borderTop:
            "1px solid color-mix(in srgb, var(--color-warning) 20%, transparent)",
        }}
      >
        <Bot
          className="size-3.5 shrink-0"
          style={{ color: "var(--color-warning)" }}
        />
        <span className="text-xs font-medium flex-1" style={{ color: "var(--color-warning)" }}>
          AI drafts need your approval before sending
        </span>
        <Tooltip.Provider delayDuration={300}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button type="button" className="flex items-center shrink-0">
                <Info
                  className="size-3.5"
                  style={{ color: "var(--color-foreground-muted)" }}
                />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="top"
                sideOffset={8}
                className="px-2.5 py-1.5 text-xs rounded-md shadow-md z-50 max-w-[220px] text-center"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              >
                AI-generated replies won't be sent until you tap{" "}
                <strong>Send Reply</strong> on each draft.
                <Tooltip.Arrow style={{ fill: "var(--color-border)" }} />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    );
  }

  // ── Automatic (default) ───────────────────────────────────────────────────────
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={{
        background:
          "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))",
        borderTop:
          "1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)",
      }}
    >
      <span
        className="size-2 rounded-full shrink-0"
        style={{ background: "var(--color-accent)" }}
      />
      <span className="text-xs flex-1" style={{ color: "var(--color-foreground-muted)" }}>
        AI is replying automatically
      </span>
      <button
        type="button"
        onClick={() =>
          pauseAIMutation.mutate({ workspaceId, conversationId: conversation.id })
        }
        disabled={pauseAIMutation.isPending}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "transparent",
          color: "var(--color-foreground-muted)",
          border: "1px solid var(--color-border)",
        }}
      >
        {pauseAIMutation.isPending ? (
          <span
            className="size-3 rounded-full border-2 animate-spin"
            style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
          />
        ) : (
          <Pause className="size-3" />
        )}
        Pause
      </button>
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSendMessage, useUpdateConversation } from "@/hooks/use-conversations";
import { useAuthStore } from "@/stores/auth-store";
import { AiStatusBanner } from "@/components/conversations/ai-status-banner";
import type { Conversation } from "@/types/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS = 1000;
const WARN_CHARS = 950;

// ─── ReplyBox ─────────────────────────────────────────────────────────────────

interface ReplyBoxProps {
  conversation: Conversation;
}

export function ReplyBox({ conversation }: ReplyBoxProps) {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMutation = useSendMessage();
  const updateMutation = useUpdateConversation();

  const isClosed = conversation.status === "closed";
  const isHandoff = conversation.status === "handoff";
  const isAiActive = !conversation.ai_paused;
  const remaining = MAX_CHARS - text.length;
  const isOverLimit = text.length > MAX_CHARS;
  const isEmpty = text.trim().length === 0;
  const canSend = !isEmpty && !isOverLimit && !sendMutation.isPending;

  // ── Auto-resize textarea ──
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    const maxHeight = 4 * 24 + 16; // 4 rows of ~24px + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }

  // ── Send on Cmd/Ctrl+Enter ──
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSend();
    }
  }

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const trimmed = text.trim();
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMutation.mutateAsync({
      workspaceId,
      conversationId: conversation.id,
      text: trimmed,
    });
  }, [canSend, text, sendMutation, workspaceId, conversation.id]);

  function handleReopen() {
    updateMutation.mutate({
      workspaceId,
      conversationId: conversation.id,
      data: { status: "open" },
    });
  }

  // ── Closed state ──
  if (isClosed) {
    return (
      <div
        className="flex items-center justify-between px-4 py-3 border-t"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <p
          className="text-sm"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          This conversation is closed
        </p>
        <button
          type="button"
          onClick={handleReopen}
          disabled={updateMutation.isPending}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-hover disabled:opacity-50"
          style={{
            background:
              "color-mix(in srgb, var(--color-accent) 12%, transparent)",
            color: "var(--color-accent)",
            border:
              "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }}
        >
          <RefreshCw className="size-3.5" />
          Reopen
        </button>
      </div>
    );
  }

  return (
    <div
      className="border-t"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* ── AI Status Banner ── */}
      <AiStatusBanner conversation={conversation} workspaceId={workspaceId} />

      {/* ── Hide input when conversation is in handoff ── */}
      {isHandoff ? null : (
        <>
          {/* ── Input area ── */}
      <div className="flex items-end gap-2 px-3 py-2.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            isAiActive
              ? "Pause AI to reply manually…"
              : "Write a reply… (Ctrl+Enter to send)"
          }
          disabled={isAiActive}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none",
            "transition-[border-color] duration-150",
            "placeholder:opacity-60",
            isAiActive && "cursor-not-allowed opacity-60",
          )}
          style={{
            background:
              "color-mix(in srgb, var(--color-border) 30%, var(--color-background))",
            color: "var(--color-foreground)",
            border: isOverLimit
              ? "1px solid var(--color-danger)"
              : "1px solid var(--color-border)",
            minHeight: "40px",
            maxHeight: "112px",
          }}
        />

        {/* Right controls */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || isAiActive}
            className={cn(
              "flex items-center justify-center size-9 rounded-lg transition-hover",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
            style={{
              background: canSend && !isAiActive
                ? "var(--color-accent)"
                : "color-mix(in srgb, var(--color-accent) 30%, var(--color-surface))",
              color: "white",
            }}
            title="Send (Ctrl+Enter)"
          >
            {sendMutation.isPending ? (
              <span
                className="size-4 rounded-full border-2 animate-spin"
                style={{
                  borderColor: "rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                }}
              />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Character counter */}
      {text.length > 0 && (
        <div className="flex justify-end px-4 pb-1.5">
          <span
            className="text-[10px]"
            style={{
              color:
                remaining <= 0
                  ? "var(--color-danger)"
                  : remaining <= MAX_CHARS - WARN_CHARS
                    ? "var(--color-warning)"
                    : "var(--color-foreground-muted)",
            }}
          >
            {remaining < 0 ? `${Math.abs(remaining)} over limit` : `${remaining} remaining`}
          </span>
        </div>
      )}
        </>
      )}
    </div>
  );
}

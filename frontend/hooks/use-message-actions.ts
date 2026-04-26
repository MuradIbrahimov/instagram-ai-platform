"use client";

import { type InfiniteData, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { queryClient } from "@/lib/query-client";
import { approveMessage, rejectMessage } from "@/lib/api/messages";
import { conversationKeys } from "@/hooks/use-conversations";
import type { Message } from "@/types/api";

// ─── Cache helpers ────────────────────────────────────────────────────────────

function patchMessageInCache(
  workspaceId: string,
  conversationId: string,
  messageId: string,
  updater: (msg: Message) => Message,
) {
  queryClient.setQueryData(
    conversationKeys.messages(workspaceId, conversationId),
    (old: InfiniteData<Message[]> | undefined) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) =>
          page.map((msg) => (msg.id === messageId ? updater(msg) : msg)),
        ),
      };
    },
  );
}

// ─── Shared var type ──────────────────────────────────────────────────────────

interface MessageActionVars {
  conversationId: string;
  messageId: string;
}

// ─── useApproveMessage ────────────────────────────────────────────────────────

export function useApproveMessage() {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");

  return useMutation({
    mutationFn: ({ conversationId, messageId }: MessageActionVars) =>
      approveMessage(workspaceId, conversationId, messageId),

    onMutate: ({ conversationId, messageId }) => {
      patchMessageInCache(workspaceId, conversationId, messageId, (msg) => ({
        ...msg,
        status: "sent" as const,
      }));
    },

    onSuccess: (updated, { conversationId, messageId }) => {
      patchMessageInCache(workspaceId, conversationId, messageId, () => updated);
      toast.success("Reply approved and queued for delivery");
    },

    onError: (_err, { conversationId, messageId }) => {
      // Revert optimistic update
      patchMessageInCache(workspaceId, conversationId, messageId, (msg) => ({
        ...msg,
        status: "queued" as const,
      }));
      toast.error("Failed to approve reply");
    },
  });
}

// ─── useRejectMessage ─────────────────────────────────────────────────────────

export function useRejectMessage() {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");

  return useMutation({
    mutationFn: ({ conversationId, messageId }: MessageActionVars) =>
      rejectMessage(workspaceId, conversationId, messageId),

    onMutate: ({ conversationId, messageId }) => {
      patchMessageInCache(workspaceId, conversationId, messageId, (msg) => ({
        ...msg,
        status: "failed" as const,
      }));
    },

    onSuccess: (updated, { conversationId, messageId }) => {
      patchMessageInCache(workspaceId, conversationId, messageId, () => updated);
      toast("AI draft discarded");
    },

    onError: (_err, { conversationId, messageId }) => {
      // Revert optimistic update
      patchMessageInCache(workspaceId, conversationId, messageId, (msg) => ({
        ...msg,
        status: "queued" as const,
      }));
      toast.error("Failed to discard reply");
    },
  });
}

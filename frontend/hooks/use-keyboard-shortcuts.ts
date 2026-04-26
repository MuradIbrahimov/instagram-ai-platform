"use client";

import { useEffect } from "react";
import { useConversationStore } from "@/stores/conversation-store";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { usePauseAI, useResumeAI, useConversation } from "@/hooks/use-conversations";

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName?.toLowerCase();
  const editable = (document.activeElement as HTMLElement)?.isContentEditable;
  return tag === "input" || tag === "textarea" || tag === "select" || !!editable;
}

/**
 * Registers global keyboard shortcuts:
 * - Cmd/Ctrl+K → open command palette (handled in providers)
 * - Escape → close command palette / modals
 * - P → pause/resume AI on active conversation
 * - ? → show keyboard shortcuts help modal
 */
export function useKeyboardShortcuts() {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const activeConversationId = useConversationStore(
    (s) => s.activeConversationId,
  );
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");
  const pauseAI = usePauseAI();
  const resumeAI = useResumeAI();
  const { data: activeConversation } = useConversation(activeConversationId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape: close command palette
      if (e.key === "Escape") {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
      }

      // Don't handle shortcuts when typing in inputs
      if (isInputFocused()) return;

      // P: pause/resume AI
      if (e.key === "p" || e.key === "P") {
        if (activeConversationId && workspaceId && activeConversation) {
          e.preventDefault();
          if (activeConversation.ai_paused) {
            resumeAI.mutate({ workspaceId, conversationId: activeConversationId });
          } else {
            pauseAI.mutate({ workspaceId, conversationId: activeConversationId });
          }
        }
        return;
      }

      // ? : open shortcuts help modal
      if (e.key === "?") {
        e.preventDefault();
        useUIStore.getState().openModal("keyboard-shortcuts");
        return;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    commandPaletteOpen,
    setCommandPaletteOpen,
    activeConversationId,
    workspaceId,
    activeConversation,
    pauseAI,
    resumeAI,
  ]);
}

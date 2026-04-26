"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

const SHORTCUTS = [
  { key: "⌘ K", description: "Open command palette" },
  { key: "⌘ Enter", description: "Send message" },
  { key: "P", description: "Pause / Resume AI (active conversation)" },
  { key: "J", description: "Next conversation" },
  { key: "K", description: "Previous conversation" },
  { key: "Esc", description: "Close modal / palette" },
  { key: "?", description: "Show this help" },
];

export function KeyboardShortcutsModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const open = activeModal === "keyboard-shortcuts";

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
          }}
          aria-describedby="shortcuts-desc"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold">
              Keyboard Shortcuts
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded p-1 hover:bg-white/10"
                aria-label="Close"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <p id="shortcuts-desc" className="sr-only">
            List of available keyboard shortcuts
          </p>

          <div className="space-y-1">
            {SHORTCUTS.map(({ key, description }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 rounded-md px-2 py-1.5"
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--color-foreground-muted)" }}
                >
                  {description}
                </span>
                <kbd
                  className="font-mono text-xs px-2 py-0.5 rounded border"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-foreground-muted)",
                    background:
                      "color-mix(in srgb, var(--color-border) 40%, transparent)",
                  }}
                >
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  BookOpen,
  LogOut,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  Plus,
  Settings2,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useConversationStore } from "@/stores/conversation-store";
import { useAuthStore } from "@/stores/auth-store";
import { useConversations, usePauseAI, useResumeAI, useConversation } from "@/hooks/use-conversations";
import { useLogout } from "@/hooks/use-auth-mutations";

// ─── Command Palette ──────────────────────────────────────────────────────────

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");
  const activeConversationId = useConversationStore(
    (s) => s.activeConversationId,
  );

  const { data: activeConversationData } = useConversation(activeConversationId);
  const pauseAI = usePauseAI();
  const resumeAI = useResumeAI();
  const logout = useLogout();

  const { data: conversationsData } = useConversations({});

  const conversations =
    conversationsData?.pages.flatMap((p) => p).slice(0, 10) ?? [];

  const run = useCallback(
    (fn: () => void) => {
      setOpen(false);
      setTimeout(fn, 50);
    },
    [setOpen],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setOpen]);

  if (!open) return null;

  const isAIPaused = activeConversationData?.ai_paused ?? false;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
      aria-modal="true"
      role="dialog"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <Command
          label="Command palette"
          className="flex flex-col"
          shouldFilter
        >
          <div
            className="flex items-center border-b px-3"
            style={{ borderColor: "var(--color-border)" }}
          >
            <Command.Input
              placeholder="Type a command or search conversations…"
              className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:opacity-50"
              style={{ color: "var(--color-foreground)" }}
              autoFocus
            />
            <kbd
              className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border font-mono"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-foreground-muted)",
              }}
            >
              ESC
            </kbd>
          </div>

          <Command.List
            className="max-h-80 overflow-y-auto p-2"
            aria-label="Command results"
          >
            <Command.Empty
              className="py-6 text-center text-sm"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              No results found.
            </Command.Empty>

            {/* Navigation */}
            <CommandGroup heading="Navigate">
              <CommandItem
                icon={<MessageSquare className="size-4" />}
                label="Conversations"
                onSelect={() => run(() => router.push("/conversations"))}
              />
              <CommandItem
                icon={<BookOpen className="size-4" />}
                label="Knowledge Base"
                onSelect={() => run(() => router.push("/knowledge"))}
              />
              <CommandItem
                icon={<Settings2 className="size-4" />}
                label="Account Settings"
                onSelect={() => run(() => router.push("/settings/accounts"))}
              />
            </CommandGroup>

            {/* Actions */}
            <CommandGroup heading="Actions">
              <CommandItem
                icon={<Plus className="size-4" />}
                label="Add Knowledge Document"
                onSelect={() => run(() => router.push("/knowledge/new"))}
              />
              {activeConversationId && (
                <>
                  {isAIPaused ? (
                    <CommandItem
                      icon={
                        <PlayCircle
                          className="size-4"
                          style={{ color: "var(--color-success)" }}
                        />
                      }
                      label="Resume AI for active conversation"
                      onSelect={() =>
                        run(() =>
                          resumeAI.mutate({
                            workspaceId,
                            conversationId: activeConversationId,
                          }),
                        )
                      }
                    />
                  ) : (
                    <CommandItem
                      icon={
                        <PauseCircle
                          className="size-4"
                          style={{ color: "var(--color-warning)" }}
                        />
                      }
                      label="Pause AI for active conversation"
                      onSelect={() =>
                        run(() =>
                          pauseAI.mutate({
                            workspaceId,
                            conversationId: activeConversationId,
                          }),
                        )
                      }
                    />
                  )}
                </>
              )}
              <CommandItem
                icon={
                  <LogOut
                    className="size-4"
                    style={{ color: "var(--color-danger)" }}
                  />
                }
                label="Logout"
                onSelect={() => run(() => logout())}
              />
            </CommandGroup>

            {/* Recent Conversations */}
            {conversations.length > 0 && (
              <CommandGroup heading="Recent Conversations">
                {conversations.map((conv) => (
                  <CommandItem
                    key={conv.id}
                    icon={
                      <MessageSquare
                        className="size-4"
                        style={{ color: "var(--color-foreground-muted)" }}
                      />
                    }
                    label={`@${conv.customer_username ?? "unknown"}`}
                    subLabel={conv.status}
                    onSelect={() =>
                      run(() => router.push(`/conversations/${conv.id}`))
                    }
                  />
                ))}
              </CommandGroup>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CommandGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Command.Group
      heading={heading}
      className="[&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-[10px] [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wide"
      style={
        {
          "--cmdk-group-heading-color": "var(--color-foreground-muted)",
        } as React.CSSProperties
      }
    >
      {children}
    </Command.Group>
  );
}

function CommandItem({
  icon,
  label,
  subLabel,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={label}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors aria-selected:bg-white/[0.06] data-[selected=true]:bg-white/[0.06]"
      style={{ color: "var(--color-foreground)" }}
    >
      <span style={{ color: "var(--color-foreground-muted)" }}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {subLabel && (
        <span
          className="text-xs"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          {subLabel}
        </span>
      )}
    </Command.Item>
  );
}

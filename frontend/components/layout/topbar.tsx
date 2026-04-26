"use client";

import { Bell } from "lucide-react";
import { useCurrentWorkspace, useUser } from "@/stores/auth-store";
import { Avatar } from "@/components/shared/avatar";
import { useIsPollingActive } from "@/hooks/use-polling-query";

// ─── Topbar ───────────────────────────────────────────────────────────────────

interface TopbarProps {
  /** Optional page title injected via server layout */
  title?: string;
  /** Optional slot for additional left-side content */
  children?: React.ReactNode;
}

export function Topbar({ title, children }: TopbarProps) {
  const workspace = useCurrentWorkspace();
  const user = useUser();
  const pollingActive = useIsPollingActive();

  return (
    <header
      className="flex h-14 items-center justify-between border-b px-6 shrink-0"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Left: page title / breadcrumb slot */}
      <div className="flex items-center gap-3 min-w-0">
        {title && (
          <h1
            className="text-base font-semibold truncate"
            style={{ color: "var(--color-foreground)" }}
          >
            {title}
          </h1>
        )}
        {children}
      </div>

      {/* Right: workspace name + notifications + user avatar */}
      <div className="flex items-center gap-4 shrink-0">
        {pollingActive && (
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--color-success, #22c55e)" }}
            aria-label="Live updates active"
          >
            <span
              className="size-1.5 rounded-full animate-pulse"
              style={{ background: "var(--color-success, #22c55e)" }}
            />
            Live
          </div>
        )}

        {workspace && (
          <span
            className="hidden md:block text-sm font-medium"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            {workspace.name}
          </span>
        )}

        {/* Notification bell (placeholder) */}
        <button
          type="button"
          className="relative flex items-center justify-center size-8 rounded-md transition-hover hover:bg-white/5"
          style={{ color: "var(--color-foreground-muted)" }}
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>

        {/* User avatar */}
        {user && (
          <Avatar name={user.full_name} size="sm" />
        )}
      </div>
    </header>
  );
}

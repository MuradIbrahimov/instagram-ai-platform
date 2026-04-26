"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, X, Check, Circle } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useAccounts } from "@/hooks/use-instagram";
import { useDocuments } from "@/hooks/use-knowledge";

// ─── Persistence helpers ──────────────────────────────────────────────────────

function getDismissedKey(workspaceId: string): string {
  return `replyr-onboarding-dismissed-${workspaceId}`;
}

function isDismissed(workspaceId: string): boolean {
  try {
    return localStorage.getItem(getDismissedKey(workspaceId)) === "1";
  } catch {
    return false;
  }
}

function dismiss(workspaceId: string): void {
  try {
    localStorage.setItem(getDismissedKey(workspaceId), "1");
  } catch {
    // ignore
  }
}

// ─── OnboardingChecklist ──────────────────────────────────────────────────────

export function OnboardingChecklist() {
  const router = useRouter();
  const workspace = useAuthStore((s) => s.currentWorkspace);
  const workspaceId = workspace?.id ?? "";

  const { data: accountsData } = useAccounts(workspaceId || undefined);
  const { data: documentsData } = useDocuments();

  const accounts = accountsData ?? [];
  const docCount = documentsData?.total ?? 0;
  const hasAutoReply = accounts.some((a) => a.auto_reply_enabled);

  const steps = [
    {
      id: "connect-account",
      label: "Connect an Instagram account",
      description: "Link your Instagram page to start receiving DMs.",
      href: "/settings/accounts",
      isComplete: accounts.length > 0,
    },
    {
      id: "add-knowledge",
      label: "Add knowledge documents",
      description: "Give the AI context to answer customer questions.",
      href: "/knowledge",
      isComplete: docCount > 0,
    },
    {
      id: "enable-auto-reply",
      label: "Enable auto-reply",
      description: "Turn on AI responses for your connected accounts.",
      href: "/settings/accounts",
      isComplete: hasAutoReply,
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const allComplete = completedCount === steps.length;

  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    if (isDismissed(workspaceId) || allComplete) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleDismiss = useCallback(() => {
    if (workspaceId) dismiss(workspaceId);
    setHidden(true);
  }, [workspaceId]);

  if (hidden || !workspaceId) return null;

  const progress = (completedCount / steps.length) * 100;

  return (
    <div
      className="fixed bottom-20 right-4 z-40 w-72 rounded-xl border shadow-xl sm:bottom-6"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
      role="complementary"
      aria-label="Onboarding checklist"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-foreground)" }}
          >
            Get started
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            {completedCount}/{steps.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded p-1 hover:bg-white/10"
            aria-label={collapsed ? "Expand checklist" : "Collapse checklist"}
            style={{ color: "var(--color-foreground-muted)" }}
          >
            {collapsed ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded p-1 hover:bg-white/10"
            aria-label="Dismiss checklist"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 w-full"
        style={{ background: "var(--color-border)" }}
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-label={`${completedCount} of ${steps.length} steps complete`}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: "var(--color-accent)",
          }}
        />
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="p-3 space-y-1">
          {steps.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => router.push(step.href)}
              className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
            >
              <div className="mt-0.5 shrink-0">
                {step.isComplete ? (
                  <div
                    className="flex size-5 items-center justify-center rounded-full"
                    style={{ background: "var(--color-success)" }}
                  >
                    <Check className="size-3 text-white" />
                  </div>
                ) : (
                  <Circle
                    className="size-5"
                    style={{ color: "var(--color-border)" }}
                  />
                )}
              </div>
              <div>
                <p
                  className="text-xs font-medium"
                  style={{
                    color: step.isComplete
                      ? "var(--color-foreground-muted)"
                      : "var(--color-foreground)",
                    textDecoration: step.isComplete ? "line-through" : "none",
                  }}
                >
                  {step.label}
                </p>
                {!step.isComplete && (
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "var(--color-foreground-muted)" }}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

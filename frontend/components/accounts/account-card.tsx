"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, Settings, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUpdateAccount, useSyncAccount } from "@/hooks/use-instagram";
import { queryClient } from "@/lib/query-client";
import { instagramKeys } from "@/hooks/use-instagram";
import type { InstagramAccount, ReplyMode } from "@/types/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function WebhookStatus({ lastSyncedAt }: { lastSyncedAt: string | null }) {
  if (!lastSyncedAt) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{
          background: "color-mix(in srgb, #f59e0b 15%, transparent)",
          color: "#f59e0b",
        }}
      >
        <span className="size-1.5 rounded-full bg-[#f59e0b]" />
        Never synced
      </span>
    );
  }

  const diffMs = Date.now() - new Date(lastSyncedAt).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours > 24) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{
          background: "color-mix(in srgb, #f59e0b 15%, transparent)",
          color: "#f59e0b",
        }}
      >
        <span className="size-1.5 rounded-full bg-[#f59e0b]" />
        Sync recommended
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        background: "color-mix(in srgb, #22c55e 15%, transparent)",
        color: "#22c55e",
      }}
    >
      <span className="size-1.5 rounded-full bg-[#22c55e]" />
      Connected
    </span>
  );
}

const REPLY_MODE_LABELS: Record<ReplyMode, string> = {
  automatic: "Automatic",
  approval_required: "Needs Approval",
  human_only: "Human Only",
};

const REPLY_MODE_STYLES: Record<
  ReplyMode,
  { bg: string; color: string }
> = {
  automatic: {
    bg: "color-mix(in srgb, #6366f1 15%, transparent)",
    color: "#818cf8",
  },
  approval_required: {
    bg: "color-mix(in srgb, #f59e0b 15%, transparent)",
    color: "#fbbf24",
  },
  human_only: {
    bg: "color-mix(in srgb, #64748b 15%, transparent)",
    color: "#94a3b8",
  },
};

// ─── AccountCard ──────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: InstagramAccount;
  workspaceId: string;
}

export function AccountCard({ account, workspaceId }: AccountCardProps) {
  const router = useRouter();
  const updateMutation = useUpdateAccount(workspaceId);
  const syncMutation = useSyncAccount(workspaceId);

  const isSyncing = syncMutation.isPending;

  // Optimistic active toggle
  function handleToggleActive() {
    const optimisticValue = !account.is_active;

    // Optimistically update both caches
    queryClient.setQueryData<InstagramAccount[]>(
      instagramKeys.all(workspaceId),
      (prev) =>
        prev?.map((a) =>
          a.id === account.id ? { ...a, is_active: optimisticValue } : a,
        ) ?? [],
    );
    queryClient.setQueryData<InstagramAccount>(
      instagramKeys.detail(workspaceId, account.id),
      (prev) => (prev ? { ...prev, is_active: optimisticValue } : prev),
    );

    updateMutation.mutate(
      { accountId: account.id, data: { is_active: optimisticValue } },
      {
        onError: () => {
          // Revert
          queryClient.setQueryData<InstagramAccount[]>(
            instagramKeys.all(workspaceId),
            (prev) =>
              prev?.map((a) =>
                a.id === account.id
                  ? { ...a, is_active: account.is_active }
                  : a,
              ) ?? [],
          );
          queryClient.setQueryData<InstagramAccount>(
            instagramKeys.detail(workspaceId, account.id),
            (prev) =>
              prev ? { ...prev, is_active: account.is_active } : prev,
          );
          toast.error("Failed to update account status.");
        },
      },
    );
  }

  function handleSync() {
    syncMutation.mutate(account.id, {
      onSuccess: () => toast.success("Account synced successfully."),
      onError: () => toast.error("Sync failed. Please try again."),
    });
  }

  const modeStyle = REPLY_MODE_STYLES[account.reply_mode];

  return (
    <div
      className="flex items-center gap-4 rounded-card border p-4"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Avatar */}
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{
          background:
            "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
        }}
      >
        @
      </div>

      {/* Identity */}
      <div className="min-w-0 w-36 shrink-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: "var(--color-foreground)" }}
        >
          @{account.instagram_username}
        </p>
        {account.page_name && (
          <p
            className="text-xs truncate"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            {account.page_name}
          </p>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
        {/* Active toggle */}
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={updateMutation.isPending}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            "transition-hover disabled:opacity-60 cursor-pointer",
          )}
          style={
            account.is_active
              ? {
                  background: "color-mix(in srgb, #22c55e 15%, transparent)",
                  color: "#22c55e",
                }
              : {
                  background: "color-mix(in srgb, #64748b 15%, transparent)",
                  color: "#94a3b8",
                }
          }
          title={account.is_active ? "Click to deactivate" : "Click to activate"}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              account.is_active ? "bg-[#22c55e]" : "bg-[#94a3b8]",
            )}
          />
          {account.is_active ? "Active" : "Inactive"}
        </button>

        {/* Auto-reply badge */}
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={
            account.auto_reply_enabled
              ? {
                  background: "color-mix(in srgb, #22c55e 15%, transparent)",
                  color: "#22c55e",
                }
              : {
                  background: "color-mix(in srgb, #64748b 15%, transparent)",
                  color: "#94a3b8",
                }
          }
        >
          {account.auto_reply_enabled ? "Auto-reply on" : "Auto-reply off"}
        </span>

        {/* Reply mode badge */}
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: modeStyle.bg, color: modeStyle.color }}
        >
          {REPLY_MODE_LABELS[account.reply_mode]}
        </span>

        {/* Webhook status */}
        <WebhookStatus lastSyncedAt={account.last_synced_at} />
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Sync button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          title={
            account.last_synced_at
              ? `Last synced ${formatDistanceToNow(new Date(account.last_synced_at), { addSuffix: true })}`
              : "Never synced"
          }
        >
          {isSyncing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          {!isSyncing && "Sync"}
        </Button>

        {/* Settings button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push(`/settings/accounts/${account.id}`)
          }
        >
          <Settings className="size-3.5" />
          Settings
        </Button>
      </div>
    </div>
  );
}

"use client";

import { AccountCard } from "./account-card";
import type { InstagramAccount } from "@/types/api";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AccountCardSkeleton() {
  return (
    <div
      className="flex items-center gap-4 rounded-card border p-4 animate-pulse"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div
        className="size-10 rounded-full shrink-0"
        style={{ background: "var(--color-border)" }}
      />
      <div className="flex-1 space-y-2">
        <div
          className="h-3.5 w-32 rounded"
          style={{ background: "var(--color-border)" }}
        />
        <div
          className="h-3 w-20 rounded"
          style={{ background: "var(--color-border)" }}
        />
      </div>
      <div className="flex gap-2">
        <div
          className="h-8 w-16 rounded-md"
          style={{ background: "var(--color-border)" }}
        />
        <div
          className="h-8 w-20 rounded-md"
          style={{ background: "var(--color-border)" }}
        />
      </div>
    </div>
  );
}

// ─── AccountList ──────────────────────────────────────────────────────────────

interface AccountListProps {
  accounts: InstagramAccount[];
  workspaceId: string;
  isLoading?: boolean;
}

export function AccountList({
  accounts,
  workspaceId,
  isLoading,
}: AccountListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <AccountCardSkeleton />
        <AccountCardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          workspaceId={workspaceId}
        />
      ))}
    </div>
  );
}

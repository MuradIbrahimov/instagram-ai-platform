"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useCurrentWorkspace } from "@/stores/auth-store";
import { useAccount } from "@/hooks/use-instagram";
import { AccountSettingsPage } from "@/components/accounts/account-settings-page";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function AccountSettingsRoute({
  params,
}: {
  params: { accountId: string };
}) {
  const { accountId } = params;
  const workspace = useCurrentWorkspace();
  const { data: account, isLoading, isError } = useAccount(workspace?.id, accountId);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !account) {
    notFound();
  }

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        href="/settings/accounts"
        className="mb-6 inline-flex items-center gap-1.5 text-sm transition-hover hover:opacity-80"
        style={{ color: "var(--color-foreground-muted)" }}
      >
        <ChevronLeft className="size-4" />
        Instagram Accounts
      </Link>

      <AccountSettingsPage account={account} workspaceId={workspace!.id} />
    </div>
  );
}

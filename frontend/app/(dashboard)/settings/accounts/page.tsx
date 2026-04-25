"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCurrentWorkspace } from "@/stores/auth-store";
import { useAccounts } from "@/hooks/use-instagram";
import { AccountList } from "@/components/accounts/account-list";
import { AddAccountModal } from "@/components/accounts/add-account-modal";
import { Button } from "@/components/ui/button";

export default function AccountsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const workspace = useCurrentWorkspace();
  const { data: accounts = [], isLoading } = useAccounts(workspace?.id);

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--color-foreground)" }}
          >
            Instagram Accounts
          </h1>
          <p
            className="mt-0.5 text-sm"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            Manage connected Instagram accounts and their reply settings.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Add Account
        </Button>
      </div>

      {/* List or empty state */}
      {!isLoading && accounts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-card border py-16 text-center"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div
            className="mb-3 flex size-12 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
            }}
          >
            @
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-foreground)" }}
          >
            No accounts connected
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            Connect your first Instagram account to start managing DMs.
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-4" />
            Add Account
          </Button>
        </div>
      ) : (
        <AccountList
          accounts={accounts}
          workspaceId={workspace?.id ?? ""}
          isLoading={isLoading}
        />
      )}

      {/* Modal */}
      {workspace && (
        <AddAccountModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          workspaceId={workspace.id}
        />
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useAuthStore } from "@/stores/auth-store";
import { WorkspaceCard } from "@/components/workspaces/workspace-card";
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import type { WorkspaceWithRole } from "@/types/api";

export default function WorkspacesPage() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const setWorkspace = useAuthStore((s) => s.setWorkspace);
  const setWorkspaces = useAuthStore((s) => s.setWorkspaces);
  const token = useAuthStore((s) => s.token);

  const { data: workspaces, isLoading } = useWorkspaces();

  // If user has exactly 1 workspace — auto-select and redirect
  useEffect(() => {
    if (!workspaces) return;
    setWorkspaces(workspaces);
    if (workspaces.length === 1) {
      setWorkspace(workspaces[0]);
      router.replace("/conversations");
    }
  }, [workspaces, setWorkspace, setWorkspaces, router]);

  function handleOpen(workspace: WorkspaceWithRole) {
    setWorkspace(workspace);
    router.push("/conversations");
  }

  // Redirect to login if no token
  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-background)" }}
    >
      {/* Header */}
      <header
        className="flex h-14 items-center justify-between border-b px-6"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Logo size="sm" />
        <Button
          variant="default"
          size="sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          New workspace
        </Button>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {isLoading ? (
          // Loading state
          <div className="flex flex-col items-center gap-4 py-20">
            <LoadingSpinner size="lg" />
            <p style={{ color: "var(--color-foreground-muted)" }} className="text-sm">
              Loading workspaces…
            </p>
          </div>
        ) : !workspaces || workspaces.length === 0 ? (
          // Zero workspaces — create first
          <div className="flex flex-col items-center py-20 text-center">
            <div
              className="mb-6 flex size-16 items-center justify-center rounded-card"
              style={{
                background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))",
              }}
            >
              <Plus
                className="size-8"
                style={{ color: "var(--color-accent)" }}
                strokeWidth={1.5}
              />
            </div>
            <h1
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--color-foreground)" }}
            >
              Create your first workspace
            </h1>
            <p
              className="text-sm max-w-sm mb-8"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              Workspaces let you manage Instagram accounts, conversations, and
              AI settings for separate brands or clients.
            </p>
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create workspace
            </Button>
          </div>
        ) : (
          // Multiple workspaces — picker grid
          <div>
            <div className="mb-8 space-y-1">
              <h1
                className="text-xl font-semibold"
                style={{ color: "var(--color-foreground)" }}
              >
                Choose a workspace
              </h1>
              <p
                className="text-sm"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                {workspaces.length} workspace
                {workspaces.length !== 1 ? "s" : ""} available
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onOpen={handleOpen}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <CreateWorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

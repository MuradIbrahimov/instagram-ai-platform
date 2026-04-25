"use client";

import { useAuthStore } from "@/stores/auth-store";
import type { Workspace } from "@/types/api";

// ─── useWorkspace ─────────────────────────────────────────────────────────────

/**
 * Returns the currentWorkspace from the auth store.
 * Throws if no workspace is set (guards must ensure this is called only when set).
 */
export function useWorkspace(): Workspace {
  const workspace = useAuthStore((s) => s.currentWorkspace);
  if (!workspace) {
    throw new Error(
      "useWorkspace() called with no active workspace. Ensure the workspace is loaded before rendering this component.",
    );
  }
  return workspace;
}

// ─── useWorkspaceId ───────────────────────────────────────────────────────────

/**
 * Returns the current workspace ID as a string.
 * Used in all API calls that require a workspace scope.
 */
export function useWorkspaceId(): string {
  return useWorkspace().id;
}

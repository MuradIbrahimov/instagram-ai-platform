"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getWorkspaces, createWorkspace } from "@/lib/api/workspaces";
import { useAuthStore } from "@/stores/auth-store";
import { queryClient } from "@/lib/query-client";
import type { CreateWorkspaceData } from "@/lib/api/workspaces";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const workspaceKeys = {
  all: ["workspaces"] as const,
  detail: (id: string) => ["workspaces", id] as const,
};

// ─── useWorkspaces ────────────────────────────────────────────────────────────

export function useWorkspaces() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: getWorkspaces,
    enabled: Boolean(token),
  });
}

// ─── useCreateWorkspace ───────────────────────────────────────────────────────

export function useCreateWorkspace() {
  const router = useRouter();
  const setWorkspace = useAuthStore((s) => s.setWorkspace);
  const setWorkspaces = useAuthStore((s) => s.setWorkspaces);

  return useMutation({
    mutationFn: (data: CreateWorkspaceData) => createWorkspace(data),
    onSuccess: async (newWorkspace) => {
      // Refresh workspace list then navigate
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      const updatedWorkspaces = await getWorkspaces();
      setWorkspaces(updatedWorkspaces);
      setWorkspace(newWorkspace);
      router.push("/dashboard");
    },
  });
}

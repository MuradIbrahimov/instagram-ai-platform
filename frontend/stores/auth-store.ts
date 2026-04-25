"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, Workspace, WorkspaceWithRole } from "@/types/api";

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  currentWorkspace: Workspace | null;
  workspaces: WorkspaceWithRole[];
  activeWorkspaceId: string | null;

  // Actions
  setAuth: (user: User, token: string) => void;
  setWorkspace: (workspace: Workspace) => void;
  setWorkspaces: (workspaces: WorkspaceWithRole[]) => void;
  setActiveWorkspace: (workspaceId: string | null) => void;
  clearAuth: () => void;
}

interface PersistedState {
  token: string | null;
  activeWorkspaceId: string | null;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      currentWorkspace: null,
      workspaces: [],
      activeWorkspaceId: null,

      setAuth: (user, token) => {
        set({ user, token });
        if (typeof document !== "undefined") {
          document.cookie = `replyr-token=${token}; path=/; SameSite=Strict`;
        }
      },

      setWorkspace: (workspace) => {
        set({ currentWorkspace: workspace });
      },

      setWorkspaces: (workspaces) => {
        const currentActive = get().activeWorkspaceId;
        const hasCurrent = currentActive
          ? workspaces.some((w) => w.id === currentActive)
          : false;
        const nextActiveId = hasCurrent
          ? currentActive
          : (workspaces[0]?.id ?? null);
        const nextWorkspace = workspaces.find((w) => w.id === nextActiveId) ?? null;
        set({
          workspaces,
          activeWorkspaceId: nextActiveId,
          currentWorkspace: nextWorkspace,
        });
      },

      setActiveWorkspace: (workspaceId) => {
        const workspace =
          get().workspaces.find((w) => w.id === workspaceId) ?? null;
        set({ activeWorkspaceId: workspaceId, currentWorkspace: workspace });
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          currentWorkspace: null,
          workspaces: [],
          activeWorkspaceId: null,
        });
        if (typeof document !== "undefined") {
          document.cookie =
            "replyr-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      },
    }),
    {
      name: "replyr-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            },
      ),
      partialize: (state): PersistedState => ({
        token: state.token,
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    },
  ),
);

// ─── Selector Hooks ───────────────────────────────────────────────────────────

export const useUser = () => useAuthStore((s) => s.user);
export const useToken = () => useAuthStore((s) => s.token);
export const useCurrentWorkspace = () =>
  useAuthStore((s) => s.currentWorkspace);

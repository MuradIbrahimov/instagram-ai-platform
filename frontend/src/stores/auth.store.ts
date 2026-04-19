import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, WorkspaceWithRole } from "@/api/types";

interface AuthState {
  user: User | null;
  token: string | null;
  workspaces: WorkspaceWithRole[];
  activeWorkspaceId: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setWorkspaces: (workspaces: WorkspaceWithRole[]) => void;
  setActiveWorkspace: (workspaceId: string | null) => void;
}

interface AuthPersistedState {
  token: string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      workspaces: [],
      activeWorkspaceId: null,
      setAuth: (user, token) => {
        set({ user, token });
      },
      clearAuth: () => {
        set({ user: null, token: null, workspaces: [], activeWorkspaceId: null });
      },
      setWorkspaces: (workspaces) => {
        const currentActive = get().activeWorkspaceId;
        const hasCurrent = currentActive
          ? workspaces.some((workspace) => workspace.id === currentActive)
          : false;
        set({
          workspaces,
          activeWorkspaceId: hasCurrent ? currentActive : workspaces[0]?.id ?? null,
        });
      },
      setActiveWorkspace: (workspaceId) => set({ activeWorkspaceId: workspaceId }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state): AuthPersistedState => ({ token: state.token }),
    },
  ),
);

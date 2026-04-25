"use client";

import { redirect } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

// ─── useAuth ──────────────────────────────────────────────────────────────────

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return {
    user,
    token,
    isAuthenticated: token !== null,
    setAuth,
    clearAuth,
  };
}

// ─── useRequireAuth ───────────────────────────────────────────────────────────

/**
 * Use in protected layouts/pages.
 * Throws a redirect to /login if the user is not authenticated.
 */
export function useRequireAuth() {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    redirect("/login");
  }
}

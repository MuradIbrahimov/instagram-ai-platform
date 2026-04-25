"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { loginUser, registerUser, getCurrentUser } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { queryClient } from "@/lib/query-client";
import { ApiError } from "@/lib/api";
import type { LoginData, RegisterData } from "@/lib/api/auth";

// ─── useLogin ─────────────────────────────────────────────────────────────────

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginData) => {
      const tokenResponse = await loginUser(data);
      // Temporarily set the token so getCurrentUser can use it
      setAuth({ id: "", email: "", full_name: "", is_active: true, created_at: "" }, tokenResponse.access_token);
      const user = await getCurrentUser();
      return { user, token: tokenResponse.access_token };
    },
    onSuccess: ({ user, token }) => {
      queryClient.clear();
      setAuth(user, token);
      router.push("/workspaces");
    },
  });
}

// ─── useRegister ──────────────────────────────────────────────────────────────

export function useRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      await registerUser(data);
      // Auto-login after registration
      const tokenResponse = await loginUser({
        email: data.email,
        password: data.password,
      });
      setAuth({ id: "", email: "", full_name: "", is_active: true, created_at: "" }, tokenResponse.access_token);
      const user = await getCurrentUser();
      return { user, token: tokenResponse.access_token };
    },
    onSuccess: ({ user, token }) => {
      queryClient.clear();
      setAuth(user, token);
      router.push("/workspaces");
    },
  });
}

// ─── useLogout ────────────────────────────────────────────────────────────────

export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return () => {
    clearAuth();
    queryClient.clear();
    router.push("/login");
  };
}

// ─── Type re-export for consumers ─────────────────────────────────────────────

export type { ApiError };

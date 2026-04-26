"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore, useToken, useCurrentWorkspace } from "@/stores/auth-store";
import { getCurrentUser } from "@/lib/api/auth";
import { FullPageSpinner } from "@/components/shared/loading-spinner";

interface DashboardGuardProps {
  children: React.ReactNode;
}

export function DashboardGuard({ children }: DashboardGuardProps) {
  const router = useRouter();
  const token = useToken();
  const currentWorkspace = useCurrentWorkspace();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Redirect to login immediately if no token
  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  // Validate token via /auth/me — 401 is caught by axios interceptor which
  // clears auth and redirects to /login automatically.
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: false,
  });

  // Sync latest user into store
  useEffect(() => {
    if (user && token) {
      setAuth(user, token);
    }
  }, [user, token, setAuth]);

  // Redirect to workspace picker if token is valid but no workspace selected.
  // Also redirect if the /me query failed with a non-401 error (network error, 5xx)
  // to avoid an infinite spinner — the workspaces page will re-validate.
  useEffect(() => {
    if (isError && !currentWorkspace) {
      router.replace("/workspaces");
      return;
    }
    if (!isLoading && user && !currentWorkspace) {
      router.replace("/workspaces");
    }
  }, [isLoading, isError, user, currentWorkspace, router]);

  // Show spinner while validating token or no token yet.
  // If we have a persisted workspace, skip the spinner so the UI shows immediately.
  if (!token || (isLoading && !currentWorkspace)) {
    return <FullPageSpinner />;
  }

  // Workspace missing — will redirect, show spinner in the meantime
  if (!currentWorkspace) {
    return <FullPageSpinner />;
  }

  return <>{children}</>;
}

import { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "@/features/auth/hooks/useMe";
import { useWorkspaces } from "@/features/workspaces/hooks/useWorkspaces";
import { useAuthStore } from "@/stores/auth.store";
import { Skeleton } from "@/components/ui/skeleton";

interface RequireAuthProps {
  children: React.ReactNode;
}

function FullPageSkeleton(): React.JSX.Element {
  return (
    <div className="p-6">
      <Skeleton className="mb-6 h-10 w-52" />
      <Skeleton className="h-[600px] w-full rounded-xl" />
    </div>
  );
}

export function RequireAuth({ children }: RequireAuthProps): React.JSX.Element {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const isHydrated = useAuthStore.persist.hasHydrated();

  const meQuery = useMe();
  const workspacesQuery = useWorkspaces();

  useEffect(() => {
    if (meQuery.isError) {
      clearAuth();
    }
  }, [clearAuth, meQuery.isError]);

  const redirectPath = useMemo(() => {
    const currentPath = `${location.pathname}${location.search}`;
    return `/login?redirect=${encodeURIComponent(currentPath)}`;
  }, [location.pathname, location.search]);

  if (!isHydrated) {
    return <FullPageSkeleton />;
  }

  if (!token) {
    return <Navigate to={redirectPath} replace />;
  }

  if (
    meQuery.isLoading ||
    workspacesQuery.isLoading ||
    (user === null && meQuery.isFetching)
  ) {
    return <FullPageSkeleton />;
  }

  if (!user || meQuery.isError) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

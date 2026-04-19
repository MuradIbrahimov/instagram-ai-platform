import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth.store";

export function RootRedirect(): React.JSX.Element {
  const navigate = useNavigate();
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const workspaces = useAuthStore((state) => state.workspaces);
  const setActiveWorkspace = useAuthStore((state) => state.setActiveWorkspace);

  useEffect(() => {
    if (activeWorkspaceId) {
      navigate(`/w/${activeWorkspaceId}/conversations`, { replace: true });
      return;
    }

    if (workspaces.length > 0) {
      const firstWorkspaceId = workspaces[0].id;
      setActiveWorkspace(firstWorkspaceId);
      navigate(`/w/${firstWorkspaceId}/conversations`, { replace: true });
      return;
    }

    navigate("/workspaces", { replace: true });
  }, [activeWorkspaceId, navigate, setActiveWorkspace, workspaces]);

  return (
    <div className="p-6">
      <Skeleton className="h-10 w-48" />
    </div>
  );
}

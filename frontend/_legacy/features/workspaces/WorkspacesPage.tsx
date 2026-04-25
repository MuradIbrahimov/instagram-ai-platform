import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateWorkspaceDialog } from "@/features/workspaces/CreateWorkspaceDialog";
import { useWorkspaces } from "@/features/workspaces/hooks/useWorkspaces";
import { useAuthStore } from "@/stores/auth.store";

export function WorkspacesPage(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const setActiveWorkspace = useAuthStore((state) => state.setActiveWorkspace);
  const [dialogOpen, setDialogOpen] = useState(location.pathname.endsWith("/new"));

  const workspacesQuery = useWorkspaces();

  useEffect(() => {
    if (location.pathname.endsWith("/new")) {
      setDialogOpen(true);
    }
  }, [location.pathname]);

  const handleDialogOpenChange = (open: boolean): void => {
    setDialogOpen(open);
    if (!open && location.pathname.endsWith("/new")) {
      navigate("/workspaces", { replace: true });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="text-sm text-muted-foreground">Manage your tenant workspaces and access roles.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New workspace
        </Button>
      </div>

      {workspacesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : null}

      {workspacesQuery.isError ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-destructive">Unable to load workspaces right now.</p>
          </CardContent>
        </Card>
      ) : null}

      {workspacesQuery.data && workspacesQuery.data.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>You don&apos;t have any workspaces yet.</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setDialogOpen(true)}>Create your first workspace</Button>
          </CardContent>
        </Card>
      ) : null}

      {workspacesQuery.data && workspacesQuery.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspacesQuery.data.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              onClick={() => {
                setActiveWorkspace(workspace.id);
                navigate(`/w/${workspace.id}/conversations`);
              }}
              className="text-left"
            >
              <Card className="h-full transition-transform hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate text-lg">{workspace.name}</CardTitle>
                    <Badge variant="secondary">{workspace.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Slug: {workspace.slug}</p>
                  <p className="text-sm text-muted-foreground">
                    Created: {format(new Date(workspace.created_at), "MMM d, yyyy")}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      ) : null}

      <CreateWorkspaceDialog open={dialogOpen} onOpenChange={handleDialogOpenChange} />
    </section>
  );
}

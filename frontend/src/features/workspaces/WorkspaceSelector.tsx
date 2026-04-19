import { useMemo } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";

export function WorkspaceSelector(): React.JSX.Element {
  const navigate = useNavigate();
  const workspaces = useAuthStore((state) => state.workspaces);
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const setActiveWorkspace = useAuthStore((state) => state.setActiveWorkspace);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0] ?? null,
    [activeWorkspaceId, workspaces],
  );

  const onSelectWorkspace = (workspaceId: string): void => {
    setActiveWorkspace(workspaceId);
    navigate(`/w/${workspaceId}/conversations`);
  };

  const onCreateWorkspace = (): void => {
    navigate("/workspaces/new");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback>
                {(activeWorkspace?.name?.charAt(0) ?? "W").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-left text-sm font-medium">
              {activeWorkspace?.name ?? "Select Workspace"}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[260px]" align="start">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem key={workspace.id} onClick={() => onSelectWorkspace(workspace.id)}>
            <Avatar className="mr-2 h-6 w-6">
              <AvatarFallback>{workspace.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate">{workspace.name}</span>
            {workspace.id === activeWorkspaceId ? <Check className="h-4 w-4" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateWorkspace}>
          <Plus className="mr-2 h-4 w-4" />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

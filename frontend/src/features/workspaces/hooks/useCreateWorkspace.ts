import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/api/client";
import { createWorkspace, type CreateWorkspaceInput } from "@/api/workspaces";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/stores/auth.store";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const setActiveWorkspace = useAuthStore((state) => state.setActiveWorkspace);

  return useMutation({
    mutationFn: (data: CreateWorkspaceInput) => createWorkspace(data),
    onSuccess: async (workspace) => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setActiveWorkspace(workspace.id);
      toast({
        title: "Workspace created",
        description: "Your new workspace is ready.",
        variant: "success",
      });
      navigate(`/w/${workspace.id}/conversations`, { replace: true });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Failed to create workspace.";
      toast({
        title: "Creation failed",
        description: message,
        variant: "destructive",
      });
    },
  });
}

import { apiClient } from "@/api/client";
import { parseWorkspace, parseWorkspaceWithRoleList } from "@/api/schemas";
import type { Workspace, WorkspaceWithRole } from "@/api/types";

export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
}

export const listWorkspaces = async (): Promise<WorkspaceWithRole[]> => {
  const response = await apiClient.get("/workspaces");
  return parseWorkspaceWithRoleList(response.data);
};

export const getWorkspace = async (workspaceId: string): Promise<Workspace> => {
  const response = await apiClient.get(`/workspaces/${workspaceId}`);
  return parseWorkspace(response.data);
};

export const createWorkspace = async (payload: CreateWorkspaceInput): Promise<Workspace> => {
  const response = await apiClient.post("/workspaces", payload);
  return parseWorkspace(response.data);
};

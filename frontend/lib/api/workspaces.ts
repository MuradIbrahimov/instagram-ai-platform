import { api } from "@/lib/api";
import type { Workspace, WorkspaceWithRole } from "@/types/api";

export interface CreateWorkspaceData {
  name: string;
  slug?: string;
}

export function getWorkspaces(): Promise<WorkspaceWithRole[]> {
  return api.get<WorkspaceWithRole[]>("/workspaces");
}

export function createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
  return api.post<Workspace>("/workspaces", data);
}

export function getWorkspace(id: string): Promise<Workspace> {
  return api.get<Workspace>(`/workspaces/${id}`);
}

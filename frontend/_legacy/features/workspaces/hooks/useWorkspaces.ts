import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listWorkspaces } from "@/api/workspaces";
import { useAuthStore } from "@/stores/auth.store";

export function useWorkspaces() {
  const token = useAuthStore((state) => state.token);
  const setWorkspaces = useAuthStore((state) => state.setWorkspaces);

  const query = useQuery({
    queryKey: ["workspaces"],
    queryFn: listWorkspaces,
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setWorkspaces(query.data);
    }
  }, [query.data, setWorkspaces]);

  return query;
}

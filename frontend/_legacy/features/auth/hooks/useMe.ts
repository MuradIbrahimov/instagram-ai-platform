import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/auth";
import type { User } from "@/api/types";
import { useAuthStore } from "@/stores/auth.store";

export function useMe() {
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);

  const query = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => getMe(),
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data && token) {
      setAuth(query.data, token);
    }
  }, [query.data, setAuth, token]);

  return query;
}

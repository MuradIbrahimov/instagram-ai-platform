import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // 4xx errors are not retryable
    const code = Number(error.code);
    if (!Number.isNaN(code) && code >= 400 && code < 500) {
      return false;
    }
    if (error.code === "unauthorized") return false;
  }
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      retry: (failureCount, error) => {
        if (!isNetworkError(error)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

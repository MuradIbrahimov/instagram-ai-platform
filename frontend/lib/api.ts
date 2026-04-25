import axios, { type AxiosError } from "axios";
import type { ApiError as ApiErrorPayload } from "@/types/api";

// ─── Typed Error ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly code: string;

  public constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.code = payload.code;
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use((config) => {
  // Import lazily to avoid circular deps — store is a singleton, safe to call here.
  // We use a dynamic require-style import to stay compatible with Next.js SSR.
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuthStore } = require("@/stores/auth-store") as {
      useAuthStore: { getState: () => { token: string | null } };
    };
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response Interceptor ─────────────────────────────────────────────────────

type ErrorResponseData = {
  detail?: string | { code?: string; message?: string };
};

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponseData>) => {
    if (error.response?.status === 401) {
      const detail = error.response?.data?.detail;
      const errorCode =
        detail && typeof detail === "object" ? (detail.code ?? "") : "";

      // Only treat as "session expired" when it's genuinely an expired/missing
      // token on a protected route, not when the server says "invalid_credentials"
      // (wrong email/password on the login form).
      const isAuthFailure =
        errorCode === "invalid_credentials" ||
        errorCode === "not_authenticated" ||
        errorCode === "inactive_user";

      if (!isAuthFailure && typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useAuthStore } = require("@/stores/auth-store") as {
          useAuthStore: { getState: () => { clearAuth: () => void } };
        };
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== "/login") {
          const redirect = encodeURIComponent(
            window.location.pathname + window.location.search,
          );
          window.location.assign(`/login?redirect=${redirect}`);
        }
      }

      // Surface the actual server error message when available
      if (detail && typeof detail === "object") {
        throw new ApiError({
          code: detail.code ?? "unauthorized",
          message: detail.message ?? "Your session has expired. Please sign in again.",
        });
      }
      if (typeof detail === "string") {
        throw new ApiError({ code: "unauthorized", message: detail });
      }

      throw new ApiError({
        code: "unauthorized",
        message: "Your session has expired. Please sign in again.",
      });
    }

    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      throw new ApiError({
        code: String(error.response?.status ?? "error"),
        message: detail,
      });
    }

    if (detail && typeof detail === "object") {
      throw new ApiError({
        code: detail.code ?? String(error.response?.status ?? "error"),
        message: detail.message ?? "An unexpected error occurred.",
      });
    }

    throw new ApiError({
      code: String(error.response?.status ?? "network_error"),
      message: error.message || "An unexpected network error occurred.",
    });
  },
);

// ─── Typed Wrappers ───────────────────────────────────────────────────────────

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),

  delete: <T>(url: string) => apiClient.delete<T>(url).then((r) => r.data),
};

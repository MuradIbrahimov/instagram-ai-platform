import axios, { type AxiosError } from "axios";
import { useAuthStore } from "@/stores/auth.store";

export interface ApiErrorPayload {
  code?: string;
  message: string;
}

export class ApiError extends Error {
  public readonly code?: string;

  public constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.code = payload.code;
    this.name = "ApiError";
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | { code?: string; message?: string } }>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== "/login") {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.assign(`/login?redirect=${redirect}`);
      }
      throw new ApiError({ code: "unauthorized", message: "Your session has expired. Please sign in again." });
    }

    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      throw new ApiError({ code: String(error.response?.status ?? "error"), message: detail });
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

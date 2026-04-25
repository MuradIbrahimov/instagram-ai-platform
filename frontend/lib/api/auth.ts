import { api } from "@/lib/api";
import type { User, TokenResponse } from "@/types/api";

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export function registerUser(data: RegisterData): Promise<User> {
  return api.post<User>("/auth/register", data);
}

export function loginUser(data: LoginData): Promise<TokenResponse> {
  return api.post<TokenResponse>("/auth/login", data);
}

export function getCurrentUser(): Promise<User> {
  return api.get<User>("/auth/me");
}

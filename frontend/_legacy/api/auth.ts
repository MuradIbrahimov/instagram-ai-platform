import { apiClient } from "@/api/client";
import { parseTokenResponse, parseUser } from "@/api/schemas";
import type { TokenResponse, User } from "@/api/types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
}

export const loginUser = async (payload: LoginInput): Promise<TokenResponse> => {
  const response = await apiClient.post("/auth/login", payload);
  return parseTokenResponse(response.data);
};

export const registerUser = async (payload: RegisterInput): Promise<User> => {
  const response = await apiClient.post("/auth/register", payload);
  return parseUser(response.data);
};

export const getMe = async (accessToken?: string): Promise<User> => {
  const response = await apiClient.get("/auth/me", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });
  return parseUser(response.data);
};

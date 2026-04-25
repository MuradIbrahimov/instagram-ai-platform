import { api } from "@/lib/api";
import type {
  InstagramAccount,
  CreateInstagramAccountData,
  UpdateInstagramAccountData,
} from "@/types/api";

export function getAccounts(workspaceId: string): Promise<InstagramAccount[]> {
  return api.get<InstagramAccount[]>(
    `/workspaces/${workspaceId}/instagram/accounts`,
  );
}

export function getAccount(
  workspaceId: string,
  accountId: string,
): Promise<InstagramAccount> {
  return api.get<InstagramAccount>(
    `/workspaces/${workspaceId}/instagram/accounts/${accountId}`,
  );
}

export function createAccount(
  workspaceId: string,
  data: CreateInstagramAccountData,
): Promise<InstagramAccount> {
  return api.post<InstagramAccount>(
    `/workspaces/${workspaceId}/instagram/accounts`,
    data,
  );
}

export function updateAccount(
  workspaceId: string,
  accountId: string,
  data: UpdateInstagramAccountData,
): Promise<InstagramAccount> {
  return api.patch<InstagramAccount>(
    `/workspaces/${workspaceId}/instagram/accounts/${accountId}`,
    data,
  );
}

export function syncAccount(
  workspaceId: string,
  accountId: string,
): Promise<{ status: string }> {
  return api.post<{ status: string }>(
    `/workspaces/${workspaceId}/instagram/accounts/${accountId}/sync`,
  );
}

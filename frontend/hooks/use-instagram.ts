"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  syncAccount,
} from "@/lib/api/instagram";
import { queryClient } from "@/lib/query-client";
import type {
  InstagramAccount,
  CreateInstagramAccountData,
  UpdateInstagramAccountData,
} from "@/types/api";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const instagramKeys = {
  all: (workspaceId: string) =>
    ["instagram", "accounts", workspaceId] as const,
  detail: (workspaceId: string, accountId: string) =>
    ["instagram", "accounts", workspaceId, accountId] as const,
};

// ─── useAccounts ──────────────────────────────────────────────────────────────

export function useAccounts(workspaceId: string | undefined) {
  return useQuery({
    queryKey: instagramKeys.all(workspaceId ?? ""),
    queryFn: () => getAccounts(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
  });
}

// ─── useAccount ───────────────────────────────────────────────────────────────

export function useAccount(
  workspaceId: string | undefined,
  accountId: string | undefined,
) {
  return useQuery({
    queryKey: instagramKeys.detail(workspaceId ?? "", accountId ?? ""),
    queryFn: () => getAccount(workspaceId!, accountId!),
    enabled: Boolean(workspaceId) && Boolean(accountId),
  });
}

// ─── useCreateAccount ─────────────────────────────────────────────────────────

export function useCreateAccount(workspaceId: string) {
  return useMutation({
    mutationFn: (data: CreateInstagramAccountData) =>
      createAccount(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: instagramKeys.all(workspaceId),
      });
    },
  });
}

// ─── useUpdateAccount ─────────────────────────────────────────────────────────

export function useUpdateAccount(workspaceId: string) {
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string;
      data: UpdateInstagramAccountData;
    }) => updateAccount(workspaceId, accountId, data),
    onSuccess: (updated) => {
      // Update the detail cache
      queryClient.setQueryData<InstagramAccount>(
        instagramKeys.detail(workspaceId, updated.id),
        updated,
      );
      // Update item in the list cache
      queryClient.setQueryData<InstagramAccount[]>(
        instagramKeys.all(workspaceId),
        (prev) =>
          prev?.map((a) => (a.id === updated.id ? updated : a)) ?? [updated],
      );
    },
  });
}

// ─── useSyncAccount ───────────────────────────────────────────────────────────

export function useSyncAccount(workspaceId: string) {
  return useMutation({
    mutationFn: (accountId: string) => syncAccount(workspaceId, accountId),
    onSuccess: (_result, accountId) => {
      // Refresh the account to pick up updated last_synced_at
      queryClient.invalidateQueries({
        queryKey: instagramKeys.detail(workspaceId, accountId),
      });
      queryClient.invalidateQueries({
        queryKey: instagramKeys.all(workspaceId),
      });
    },
  });
}

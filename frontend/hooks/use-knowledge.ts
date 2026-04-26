"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { queryClient } from "@/lib/query-client";
import {
  createDocument,
  deleteDocument,
  getDocument,
  getDocuments,
  type CreateDocumentData,
} from "@/lib/api/knowledge";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const knowledgeKeys = {
  all: (workspaceId: string) => ["knowledge", workspaceId] as const,
  lists: (workspaceId: string) => ["knowledge", workspaceId, "list"] as const,
  list: (workspaceId: string, page: number) =>
    ["knowledge", workspaceId, "list", page] as const,
  detail: (workspaceId: string, documentId: string) =>
    ["knowledge", workspaceId, "document", documentId] as const,
};

// ─── useDocuments ─────────────────────────────────────────────────────────────

export function useDocuments(page = 1) {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");

  return useQuery({
    queryKey: knowledgeKeys.list(workspaceId, page),
    queryFn: () => getDocuments(workspaceId, page, 20),
    staleTime: 60_000,
    enabled: Boolean(workspaceId),
  });
}

// ─── useDocument ──────────────────────────────────────────────────────────────

export function useDocument(documentId: string) {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");

  return useQuery({
    queryKey: knowledgeKeys.detail(workspaceId, documentId),
    queryFn: () => getDocument(workspaceId, documentId),
    staleTime: 10_000,
    enabled: Boolean(workspaceId) && Boolean(documentId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "processing" ? 2000 : false;
    },
  });
}

// ─── useCreateDocument ────────────────────────────────────────────────────────

export function useCreateDocument() {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateDocumentData) =>
      createDocument(workspaceId, data),
    onSuccess: (doc) => {
      void queryClient.invalidateQueries({
        queryKey: knowledgeKeys.lists(workspaceId),
      });
      toast.success("Document added");
      router.push(`/knowledge/${doc.id}`);
    },
    onError: () => {
      toast.error("Failed to add document");
    },
  });
}

// ─── useDeleteDocument ────────────────────────────────────────────────────────

export function useDeleteDocument() {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");
  const router = useRouter();

  return useMutation({
    mutationFn: (documentId: string) =>
      deleteDocument(workspaceId, documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: knowledgeKeys.lists(workspaceId),
      });
      router.replace("/knowledge");
      toast.success("Document deleted");
    },
    onError: () => {
      toast.error("Failed to delete document");
    },
  });
}

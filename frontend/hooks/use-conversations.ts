"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { queryClient } from "@/lib/query-client";
import {
  assignConversation,
  getConversation,
  getConversations,
  getMessages,
  pauseAI,
  resumeAI,
  sendMessage,
  updateConversation,
} from "@/lib/api/conversations";
import type { Conversation, ConversationFilters, Message } from "@/types/api";
import type { UpdateConversationData } from "@/lib/api/conversations";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONV_PAGE_SIZE = 20;
const MSG_PAGE_SIZE = 50;

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const conversationKeys = {
  all: (workspaceId: string) => ["conversations", workspaceId] as const,
  lists: (workspaceId: string) =>
    ["conversations", workspaceId, "list"] as const,
  list: (workspaceId: string, filters: ConversationFilters) =>
    ["conversations", workspaceId, "list", filters] as const,
  detail: (workspaceId: string, conversationId: string) =>
    ["conversations", workspaceId, conversationId] as const,
  messages: (workspaceId: string, conversationId: string) =>
    ["conversations", workspaceId, conversationId, "messages"] as const,
};

// ─── useConversations ─────────────────────────────────────────────────────────

export function useConversations(filters: ConversationFilters) {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");

  return useInfiniteQuery({
    queryKey: conversationKeys.list(workspaceId, filters),
    queryFn: ({ pageParam }) =>
      getConversations(workspaceId, filters, pageParam as number, CONV_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.length === CONV_PAGE_SIZE
        ? (lastPageParam as number) + 1
        : undefined,
    staleTime: 10_000,
    enabled: Boolean(workspaceId),
  });
}

// ─── useConversation ──────────────────────────────────────────────────────────

export function useConversation(conversationId: string | null) {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");

  return useQuery({
    queryKey: conversationKeys.detail(workspaceId, conversationId ?? ""),
    queryFn: () => getConversation(workspaceId, conversationId!),
    enabled: Boolean(workspaceId && conversationId),
    staleTime: 10_000,
  });
}

// ─── useMessages ──────────────────────────────────────────────────────────────

export function useMessages(conversationId: string | null) {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");

  return useInfiniteQuery({
    queryKey: conversationKeys.messages(
      workspaceId,
      conversationId ?? "",
    ),
    queryFn: ({ pageParam }) =>
      getMessages(
        workspaceId,
        conversationId!,
        pageParam as number,
        MSG_PAGE_SIZE,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.length === MSG_PAGE_SIZE
        ? (lastPageParam as number) + 1
        : undefined,
    staleTime: 5_000,
    enabled: Boolean(workspaceId && conversationId),
  });
}

// ─── useSendMessage ───────────────────────────────────────────────────────────

interface SendMessageVars {
  workspaceId: string;
  conversationId: string;
  text: string;
}

export function useSendMessage() {
  return useMutation({
    mutationFn: ({ workspaceId, conversationId, text }: SendMessageVars) =>
      sendMessage(workspaceId, conversationId, text),

    onMutate: async ({ workspaceId, conversationId, text }) => {
      const key = conversationKeys.messages(workspaceId, conversationId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData(key);

      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_type: "human",
        direction: "outbound",
        message_type: "text",
        text_content: text,
        status: "queued",
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(
        key,
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return old;
          const pages = [...old.pages];
          pages[pages.length - 1] = [
            ...pages[pages.length - 1],
            optimistic,
          ];
          return { ...old, pages };
        },
      );

      return { previous, optimistic };
    },

    onError: (_err, { workspaceId, conversationId }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          conversationKeys.messages(workspaceId, conversationId),
          context.previous,
        );
      }
    },

    onSuccess: (_msg, { workspaceId, conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(workspaceId, conversationId),
      });
      // Update conversation list (unread count, last_message_at)
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(workspaceId),
      });
    },
  });
}

// ─── usePauseAI ───────────────────────────────────────────────────────────────

interface AIActionVars {
  workspaceId: string;
  conversationId: string;
}

export function usePauseAI() {
  return useMutation({
    mutationFn: ({ workspaceId, conversationId }: AIActionVars) =>
      pauseAI(workspaceId, conversationId),

    onMutate: async ({ workspaceId, conversationId }) => {
      const key = conversationKeys.detail(workspaceId, conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Conversation>(key);
      queryClient.setQueryData<Conversation>(key, (old) =>
        old ? { ...old, ai_paused: true } : old,
      );
      return { previous };
    },

    onError: (_err, { workspaceId, conversationId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          conversationKeys.detail(workspaceId, conversationId),
          context.previous,
        );
      }
    },

    onSuccess: (updated, { workspaceId, conversationId }) => {
      queryClient.setQueryData(
        conversationKeys.detail(workspaceId, conversationId),
        updated,
      );
    },
  });
}

// ─── useResumeAI ──────────────────────────────────────────────────────────────

export function useResumeAI() {
  return useMutation({
    mutationFn: ({ workspaceId, conversationId }: AIActionVars) =>
      resumeAI(workspaceId, conversationId),

    onMutate: async ({ workspaceId, conversationId }) => {
      const key = conversationKeys.detail(workspaceId, conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Conversation>(key);
      queryClient.setQueryData<Conversation>(key, (old) =>
        old ? { ...old, ai_paused: false } : old,
      );
      return { previous };
    },

    onError: (_err, { workspaceId, conversationId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          conversationKeys.detail(workspaceId, conversationId),
          context.previous,
        );
      }
    },

    onSuccess: (updated, { workspaceId, conversationId }) => {
      queryClient.setQueryData(
        conversationKeys.detail(workspaceId, conversationId),
        updated,
      );
    },
  });
}

// ─── useUpdateConversation ────────────────────────────────────────────────────

interface UpdateConversationVars {
  workspaceId: string;
  conversationId: string;
  data: UpdateConversationData;
}

export function useUpdateConversation() {
  return useMutation({
    mutationFn: ({ workspaceId, conversationId, data }: UpdateConversationVars) =>
      updateConversation(workspaceId, conversationId, data),

    onSuccess: (updated, { workspaceId, conversationId }) => {
      queryClient.setQueryData(
        conversationKeys.detail(workspaceId, conversationId),
        updated,
      );
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(workspaceId),
      });
    },
  });
}

// ─── useAssignConversation ────────────────────────────────────────────────────

interface AssignVars {
  workspaceId: string;
  conversationId: string;
  userId: string;
}

export function useAssignConversation() {
  return useMutation({
    mutationFn: ({ workspaceId, conversationId, userId }: AssignVars) =>
      assignConversation(workspaceId, conversationId, userId),

    onSuccess: (updated, { workspaceId, conversationId }) => {
      queryClient.setQueryData(
        conversationKeys.detail(workspaceId, conversationId),
        updated,
      );
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(workspaceId),
      });
    },
  });
}

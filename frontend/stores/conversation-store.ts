"use client";

import { create } from "zustand";
import type { ConversationFilters, ConversationStatus } from "@/types/api";

// ─── State Shape ──────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: ConversationFilters = {};

interface ConversationState {
  activeConversationId: string | null;
  filters: ConversationFilters;

  setActiveConversation: (id: string | null) => void;
  setFilters: (filters: Partial<ConversationFilters>) => void;
  setStatusFilter: (status: ConversationStatus | undefined) => void;
  resetFilters: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useConversationStore = create<ConversationState>()((set) => ({
  activeConversationId: null,
  filters: DEFAULT_FILTERS,

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  setStatusFilter: (status) =>
    set((state) => ({
      filters: { ...state.filters, status },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));

// ─── Selector hooks ───────────────────────────────────────────────────────────

export const useActiveConversationId = () =>
  useConversationStore((s) => s.activeConversationId);
export const useConversationFilters = () =>
  useConversationStore((s) => s.filters);

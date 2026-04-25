"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversations } from "@/hooks/use-conversations";
import { useConversationStore } from "@/stores/conversation-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  ConversationListItemCard,
  ConversationListItemSkeleton,
} from "./conversation-list-item";
import type { ConversationStatus } from "@/types/api";

// ─── Status Tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ConversationStatus | undefined }[] =
  [
    { label: "All", value: undefined },
    { label: "Open", value: "open" },
    { label: "Pending", value: "pending" },
    { label: "Handoff", value: "handoff" },
    { label: "Closed", value: "closed" },
  ];

// ─── ConversationList ─────────────────────────────────────────────────────────

export function ConversationList() {
  const router = useRouter();
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id ?? "");
  const activeId = useConversationStore((s) => s.activeConversationId);
  const filters = useConversationStore((s) => s.filters);
  const setFilters = useConversationStore((s) => s.setFilters);
  const setStatusFilter = useConversationStore((s) => s.setStatusFilter);

  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [unreadOnly, setUnreadOnly] = useState(filters.unread_only ?? false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: searchInput || undefined });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, setFilters]);

  // Sync unread toggle
  useEffect(() => {
    setFilters({ unread_only: unreadOnly || undefined });
  }, [unreadOnly, setFilters]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useConversations(filters);

  const items = useMemo(
    () => data?.pages.flatMap((p) => p) ?? [],
    [data],
  );

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelect = useCallback(
    (id: string) => {
      useConversationStore.getState().setActiveConversation(id);
      router.push(`/conversations/${id}`);
    },
    [router],
  );

  return (
    <div
      className="flex flex-col h-full border-r"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-10 flex flex-col gap-2 px-3 pt-3 pb-2 border-b"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none"
            style={{ color: "var(--color-foreground-muted)" }}
          />
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-md outline-none"
            style={{
              background:
                "color-mix(in srgb, var(--color-border) 40%, var(--color-surface))",
              color: "var(--color-foreground)",
              border: "1px solid var(--color-border)",
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {STATUS_TABS.map(({ label, value }) => {
            const isActive = filters.status === value;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "shrink-0 px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                  isActive ? "" : "hover:bg-white/5",
                )}
                style={
                  isActive
                    ? {
                        background:
                          "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                        color: "var(--color-accent)",
                      }
                    : { color: "var(--color-foreground-muted)" }
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Unread toggle */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            {items.length > 0 ? `${items.length} conversation${items.length !== 1 ? "s" : ""}` : ""}
          </span>
          <button
            type="button"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md transition-colors",
              unreadOnly ? "" : "hover:bg-white/5",
            )}
            style={
              unreadOnly
                ? {
                    background:
                      "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                    color: "var(--color-accent)",
                  }
                : { color: "var(--color-foreground-muted)" }
            }
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: unreadOnly ? "var(--color-accent)" : "currentColor" }}
            />
            Unread only
          </button>
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <>
            <ConversationListItemSkeleton />
            <ConversationListItemSkeleton />
            <ConversationListItemSkeleton />
          </>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 px-4 text-center">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              No conversations found
            </p>
            {(filters.search || filters.status || filters.unread_only) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setUnreadOnly(false);
                  useConversationStore.getState().resetFilters();
                }}
                className="text-xs underline underline-offset-2"
                style={{ color: "var(--color-accent)" }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {items.map((item) => (
              <ConversationListItemCard
                key={item.id}
                item={item}
                isActive={item.id === activeId}
                onClick={() => handleSelect(item.id)}
              />
            ))}
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-1">
              {isFetchingNextPage && (
                <div className="flex justify-center py-2">
                  <span
                    className="size-4 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: "var(--color-border)",
                      borderTopColor: "var(--color-accent)",
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

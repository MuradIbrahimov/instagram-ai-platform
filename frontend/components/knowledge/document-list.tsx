"use client";

import type { KnowledgeDocumentListItem } from "@/types/api";
import { DocumentCard } from "./document-card";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DocumentCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-4"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div
        className="h-4 w-3/4 animate-pulse rounded"
        style={{ background: "var(--color-border)" }}
      />
      <div className="flex gap-2">
        <div
          className="h-5 w-16 animate-pulse rounded"
          style={{ background: "var(--color-border)" }}
        />
        <div
          className="h-5 w-12 animate-pulse rounded"
          style={{ background: "var(--color-border)" }}
        />
      </div>
      <div className="mt-auto flex items-center justify-between pt-1">
        <div
          className="h-3 w-16 animate-pulse rounded"
          style={{ background: "var(--color-border)" }}
        />
        <div
          className="h-6 w-14 animate-pulse rounded"
          style={{ background: "var(--color-border)" }}
        />
      </div>
    </div>
  );
}

// ─── DocumentList ─────────────────────────────────────────────────────────────

interface DocumentListProps {
  documents: KnowledgeDocumentListItem[];
  isLoading: boolean;
  total: number;
  page: number;
  onLoadMore: () => void;
}

export function DocumentList({
  documents,
  isLoading,
  total,
  page,
  onLoadMore,
}: DocumentListProps) {
  const hasMore = documents.length < total;

  if (isLoading && documents.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <DocumentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoading}
            className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
            }}
          >
            {isLoading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

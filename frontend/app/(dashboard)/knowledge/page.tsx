"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";
import { useDocuments } from "@/hooks/use-knowledge";
import { DocumentList } from "@/components/knowledge/document-list";

export default function KnowledgePage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDocuments(page);

  const documents = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--color-foreground)" }}
          >
            Knowledge Base
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            Documents the AI uses to answer customer questions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/knowledge/new")}
          className="flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ background: "var(--color-accent)" }}
        >
          <Plus className="size-4" />
          Add Document
        </button>
      </div>

      {/* Content */}
      {!isLoading && documents.length === 0 ? (
        <EmptyState onAdd={() => router.push("/knowledge/new")} />
      ) : (
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          total={total}
          page={page}
          onLoadMore={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border py-16 text-center"
      style={{ borderColor: "var(--color-border)" }}
    >
      <BookOpen
        className="size-10 mb-4 opacity-30"
        style={{ color: "var(--color-foreground)" }}
      />
      <p
        className="text-sm font-medium"
        style={{ color: "var(--color-foreground)" }}
      >
        No documents yet
      </p>
      <p
        className="mt-1 text-sm"
        style={{ color: "var(--color-foreground-muted)" }}
      >
        Add your first document to get started.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ background: "var(--color-accent)" }}
      >
        <Plus className="size-4" />
        Add your first document
      </button>
    </div>
  );
}

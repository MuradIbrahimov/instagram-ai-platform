"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KnowledgeDocumentListItem } from "@/types/api";
import { DeleteDocumentDialog } from "./delete-document-dialog";

interface DocumentCardProps {
  document: KnowledgeDocumentListItem;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div
        className="flex flex-col gap-3 rounded-xl border p-4"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Title */}
        <p
          className="truncate font-semibold text-sm leading-snug"
          title={doc.title}
          style={{ color: "var(--color-foreground)" }}
        >
          {doc.title}
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Source type badge */}
          <span
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium",
              doc.source_type === "url"
                ? "bg-blue-500/15 text-blue-400"
                : "bg-slate-500/15 text-slate-400",
            )}
          >
            {doc.source_type === "url" ? "URL" : "Manual"}
          </span>

          {/* Status badge */}
          {doc.status === "processing" && (
            <span className="flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
              <Loader2 className="size-3 animate-spin" />
              Processing
            </span>
          )}
          {doc.status === "ready" && (
            <span className="rounded bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
              Ready
            </span>
          )}
          {doc.status === "failed" && (
            <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
              Failed
            </span>
          )}

          {/* Chunk count */}
          {doc.status === "ready" && (
            <span
              className="font-mono text-xs"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              {doc.chunk_count} {doc.chunk_count === 1 ? "chunk" : "chunks"}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span
            className="text-xs"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            {timeAgo(doc.created_at)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/knowledge/${doc.id}`)}
              className="rounded-md border px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              View
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="rounded-md p-1.5 transition-colors hover:bg-red-500/15 hover:text-red-400"
              style={{ color: "var(--color-foreground-muted)" }}
              title="Delete document"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <DeleteDocumentDialog
        documentId={doc.id}
        documentTitle={doc.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

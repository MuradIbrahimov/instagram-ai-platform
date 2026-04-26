"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useDocument } from "@/hooks/use-knowledge";
import { ChunkList } from "@/components/knowledge/chunk-list";
import { DeleteDocumentDialog } from "@/components/knowledge/delete-document-dialog";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "processing") {
    return (
      <span className="flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
        <Loader2 className="size-3 animate-spin" />
        Processing
      </span>
    );
  }
  if (status === "ready") {
    return (
      <span className="rounded bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
        Ready
      </span>
    );
  }
  return (
    <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
      Failed
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div
        className="h-5 w-48 rounded"
        style={{ background: "var(--color-border)" }}
      />
      <div
        className="h-8 w-64 rounded"
        style={{ background: "var(--color-border)" }}
      />
      <div
        className="h-48 rounded-xl"
        style={{ background: "var(--color-border)" }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentDetailPage() {
  const params = useParams<{ documentId: string }>();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: doc, isLoading, isError } = useDocument(params.documentId);

  if (isLoading) return <PageSkeleton />;

  if (isError || !doc) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.replace("/knowledge")}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          <ArrowLeft className="size-4" />
          Back to Knowledge Base
        </button>
        <p
          className="text-sm"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          Document not found or failed to load.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.replace("/knowledge")}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          <ArrowLeft className="size-4" />
          Back to Knowledge Base
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--color-foreground)" }}
            >
              {doc.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={doc.status} />
              <span
                className="text-xs"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                {new Date(doc.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-foreground-muted)",
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        </div>

        {/* Document Content */}
        <Section title="Document Content">
          <textarea
            readOnly
            defaultValue={doc.raw_text}
            className="w-full resize-none rounded-md border p-3 font-mono text-xs leading-relaxed outline-none min-h-[200px]"
            style={{
              background: "color-mix(in srgb, var(--color-surface) 50%, transparent)",
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
            }}
            rows={Math.min(30, doc.raw_text.split("\n").length + 2)}
          />
        </Section>

        {/* Chunks */}
        {doc.status === "processing" && (
          <Section title="Chunks">
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg"
                  style={{ background: "var(--color-border)" }}
                />
              ))}
              <p
                className="text-xs pt-1"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                Chunking in progress…
              </p>
            </div>
          </Section>
        )}

        {doc.status === "failed" && (
          <Section title="Chunks">
            <p
              className="text-sm"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              Processing failed. Chunks are unavailable.
            </p>
          </Section>
        )}

        {doc.status === "ready" && doc.chunks.length > 0 && (
          <Section title="Chunks">
            <ChunkList chunks={doc.chunks} />
          </Section>
        )}
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2
        className="text-sm font-semibold"
        style={{ color: "var(--color-foreground)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

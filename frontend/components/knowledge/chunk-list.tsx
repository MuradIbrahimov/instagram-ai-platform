"use client";

import { useState } from "react";
import type { KnowledgeChunk } from "@/types/api";

interface ChunkItemProps {
  chunk: KnowledgeChunk;
}

function ChunkItem({ chunk }: ChunkItemProps) {
  const [expanded, setExpanded] = useState(false);
  const wordCount = chunk.content.split(/\s+/).filter(Boolean).length;

  return (
    <div
      className="rounded-lg border p-3"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Index badge */}
          <span
            className="mt-0.5 flex h-5 w-7 shrink-0 items-center justify-center rounded font-mono text-xs font-medium"
            style={{
              background: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
              color: "var(--color-accent)",
            }}
          >
            {chunk.chunk_index + 1}
          </span>

          {/* Content */}
          <p
            className="text-sm leading-relaxed"
            style={{
              color: "var(--color-foreground)",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: expanded ? undefined : 3,
              overflow: expanded ? "visible" : "hidden",
            }}
          >
            {chunk.content}
          </p>
        </div>

        {/* Word count */}
        <span
          className="shrink-0 font-mono text-xs"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          {wordCount}w
        </span>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 ml-10 text-xs transition-opacity hover:opacity-80"
        style={{ color: "var(--color-accent)" }}
      >
        {expanded ? "Collapse" : "Expand"}
      </button>
    </div>
  );
}

// ─── ChunkList ────────────────────────────────────────────────────────────────

interface ChunkListProps {
  chunks: KnowledgeChunk[];
}

export function ChunkList({ chunks }: ChunkListProps) {
  const avgWords =
    chunks.length > 0
      ? Math.round(
          chunks.reduce(
            (sum, c) => sum + c.content.split(/\s+/).filter(Boolean).length,
            0,
          ) / chunks.length,
        )
      : 0;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
        {chunks.length} {chunks.length === 1 ? "chunk" : "chunks"} &middot; avg{" "}
        {avgWords} words each
      </p>

      {/* Chunks */}
      <div className="space-y-2">
        {chunks.map((chunk) => (
          <ChunkItem key={chunk.id} chunk={chunk} />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCreateDocument } from "@/hooks/use-knowledge";

const MAX_TITLE = 100;
const MAX_CONTENT = 50_000;

function estimateChunks(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words === 0 ? 0 : Math.ceil(words / 400);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function NewDocumentPage() {
  const router = useRouter();
  const createDocument = useCreateDocument();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const isDirty = title.trim().length > 0 || content.trim().length > 0;

  // Warn before unload when form is dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !createDocument.isSuccess) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, createDocument.isSuccess]);

  // Auto-grow textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_CONTENT) {
        setContent(value);
      }
      // Auto-grow
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }
    },
    [],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createDocument.mutate({
      title: title.trim(),
      raw_text: content.trim(),
      source_type: "manual",
    });
  }

  const words = wordCount(content);
  const chunks = estimateChunks(content);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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

      <h1
        className="text-xl font-semibold"
        style={{ color: "var(--color-foreground)" }}
      >
        Add Document
      </h1>

      <form onSubmit={handleSubmit} className="flex gap-6">
        {/* Left — main form */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="doc-title"
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                Title
                <span className="text-red-400 ml-0.5">*</span>
              </label>
              <span
                className="text-xs tabular-nums"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                {title.length} / {MAX_TITLE}
              </span>
            </div>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) =>
                e.target.value.length <= MAX_TITLE && setTitle(e.target.value)
              }
              required
              placeholder="e.g. Return Policy, FAQ, Product Guide"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-1"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label
              htmlFor="doc-content"
              className="text-sm font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              Content
              <span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="relative">
              <textarea
                id="doc-content"
                ref={textareaRef}
                defaultValue=""
                onChange={handleContentChange}
                required
                placeholder="Paste your FAQ, product info, policies, or any text the AI should know."
                rows={10}
                className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-1 min-h-[200px]"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              />
              <span
                className="absolute bottom-2 right-3 text-xs tabular-nums pointer-events-none"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                {content.length.toLocaleString()} / {MAX_CONTENT.toLocaleString()}
              </span>
            </div>
            <p
              className="text-xs"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              Tip: Paste your FAQ, product info, policies, or any text the AI
              should know.
            </p>
          </div>

          {/* Source type */}
          <div className="space-y-2">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              Source type
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="source_type"
                  value="manual"
                  defaultChecked
                  className="accent-[var(--color-accent)]"
                />
                <span style={{ color: "var(--color-foreground)" }}>Manual</span>
              </label>
              <label className="flex cursor-not-allowed items-center gap-2.5 text-sm opacity-40">
                <input type="radio" name="source_type" value="url" disabled />
                <span style={{ color: "var(--color-foreground)" }}>
                  URL{" "}
                  <span
                    className="ml-1 text-xs"
                    style={{ color: "var(--color-foreground-muted)" }}
                  >
                    (Coming soon)
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={
              createDocument.isPending ||
              !title.trim() ||
              !content.trim()
            }
            className="flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--color-accent)" }}
          >
            {createDocument.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Add to Knowledge Base
          </button>
        </div>

        {/* Right — preview panel */}
        <aside
          className="hidden w-56 shrink-0 lg:block"
        >
          <div
            className="sticky top-0 rounded-xl border p-4 space-y-4"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              Preview
            </p>

            <div className="space-y-3">
              <Stat label="Words" value={words.toLocaleString()} />
              <Stat
                label="Est. chunks"
                value={chunks === 0 ? "—" : String(chunks)}
                hint="~400 words each"
              />
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p
        className="text-xs"
        style={{ color: "var(--color-foreground-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-lg font-semibold tabular-nums"
        style={{ color: "var(--color-foreground)" }}
      >
        {value}
      </p>
      {hint && (
        <p
          className="text-xs"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-8"
      style={{ color: "var(--color-foreground)" }}
    >
      <AlertTriangle
        className="size-10"
        style={{ color: "#f59e0b" }}
      />
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      {error.digest && (
        <p
          className="text-xs font-mono"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          Error ID: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-md px-4 py-2 text-sm font-medium text-white"
        style={{ background: "var(--color-accent)" }}
      >
        Try again
      </button>
    </main>
  );
}

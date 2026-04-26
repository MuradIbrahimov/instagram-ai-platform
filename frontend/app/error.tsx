"use client";

import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        textAlign: "center",
        padding: "2rem",
        background: "var(--color-background, #0f0f13)",
        color: "var(--color-foreground, #f1f5f9)",
      }}
    >
      <AlertTriangle
        style={{
          width: "3rem",
          height: "3rem",
          color: "#f59e0b",
        }}
      />
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
        Something went wrong
      </h1>
      {error.digest && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-foreground-muted, #64748b)",
            margin: 0,
            fontFamily: "monospace",
          }}
        >
          Error ID: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        style={{
          marginTop: "0.5rem",
          padding: "0.5rem 1.25rem",
          borderRadius: "0.5rem",
          background: "var(--color-accent, #6366f1)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        Reload
      </button>
    </div>
  );
}

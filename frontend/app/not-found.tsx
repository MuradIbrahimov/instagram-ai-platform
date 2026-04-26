import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
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
      <FileQuestion
        style={{
          width: "3rem",
          height: "3rem",
          color: "var(--color-foreground-muted, #64748b)",
        }}
      />
      <h1
        style={{ fontSize: "3rem", fontWeight: 700, margin: 0 }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: "1rem",
          color: "var(--color-foreground-muted, #64748b)",
          margin: 0,
        }}
      >
        Page not found
      </p>
      <Link
        href="/conversations"
        style={{
          marginTop: "0.5rem",
          padding: "0.5rem 1.25rem",
          borderRadius: "0.5rem",
          background: "var(--color-accent, #6366f1)",
          color: "#fff",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        Go to conversations
      </Link>
    </div>
  );
}

"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function QueryError({
  message = "Something went wrong.",
  onRetry,
  className,
}: QueryErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className,
      )}
    >
      <AlertTriangle
        className="size-8"
        style={{ color: "var(--color-warning)" }}
      />
      <p
        className="text-sm max-w-xs"
        style={{ color: "var(--color-foreground-muted)" }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md px-3 py-1.5 text-sm font-medium border transition-colors hover:bg-white/5"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

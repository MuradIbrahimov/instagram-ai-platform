"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MutationErrorProps {
  message?: string | null;
  className?: string;
}

export function MutationError({ message, className }: MutationErrorProps) {
  if (!message) return null;

  return (
    <div
      className={cn("flex items-center gap-2 text-sm", className)}
      role="alert"
    >
      <AlertCircle
        className="size-4 shrink-0"
        style={{ color: "var(--color-danger)" }}
      />
      <span style={{ color: "var(--color-danger)" }}>{message}</span>
    </div>
  );
}

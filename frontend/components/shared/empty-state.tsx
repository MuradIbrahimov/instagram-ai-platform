import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className,
      )}
    >
      {Icon && (
        <div
          className="mb-4 flex size-14 items-center justify-center rounded-card"
          style={{
            background: "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))",
          }}
        >
          <Icon
            className="size-7"
            style={{ color: "var(--color-accent)" }}
            strokeWidth={1.5}
          />
        </div>
      )}
      <h3
        className="text-base font-semibold"
        style={{ color: "var(--color-foreground)" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="mt-1 max-w-sm text-sm"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-md px-4 py-2 text-sm font-medium transition-hover hover:opacity-90"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-accent-foreground)",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

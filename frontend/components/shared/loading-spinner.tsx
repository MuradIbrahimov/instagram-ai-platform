import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  xs: "size-3 border",
  sm: "size-4 border",
  md: "size-6 border-2",
  lg: "size-10 border-2",
} as const;

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full animate-spin",
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        borderColor: "var(--color-border)",
        borderTopColor: "var(--color-accent)",
      }}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

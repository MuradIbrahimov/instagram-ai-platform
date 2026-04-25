import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
} as const;

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span
      className={cn(
        "font-mono font-bold tracking-tight select-none",
        "transition-hover group",
        SIZE_CLASSES[size],
        className,
      )}
      style={{ color: "var(--color-foreground)" }}
    >
      {/* "Repl" */}
      <span>Repl</span>
      {/* "y" with the dot on the descender acting as accent */}
      <span>y</span>
      {/* "r" — the final letter, slightly accented */}
      <span
        className="transition-hover group-hover:drop-shadow-[0_0_8px_var(--color-accent)]"
        style={{ color: "var(--color-accent)" }}
      >
        r
      </span>
      {/* Accent dot — replaces the conceptual "i" dot */}
      <span
        className="inline-block size-[0.18em] rounded-full align-[0.15em] ml-[0.05em] transition-hover group-hover:scale-150"
        style={{ background: "var(--color-accent)" }}
        aria-hidden
      />
    </span>
  );
}

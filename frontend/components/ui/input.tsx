import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border px-3 py-2 text-sm",
          "bg-transparent placeholder:text-[var(--color-foreground-muted)]",
          "transition-hover focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        style={{
          borderColor: error
            ? "var(--color-danger)"
            : "var(--color-border)",
          color: "var(--color-foreground)",
          background: "color-mix(in srgb, var(--color-surface) 60%, transparent)",
          boxShadow: "none",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error
            ? "var(--color-danger)"
            : "var(--color-accent)";
          e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, ${error ? "var(--color-danger)" : "var(--color-accent)"} 20%, transparent)`;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? "var(--color-danger)"
            : "var(--color-border)";
          e.currentTarget.style.boxShadow = "none";
          props.onBlur?.(e);
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

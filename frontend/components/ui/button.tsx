import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  loading?: boolean;
}

const VARIANT_STYLES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "text-white hover:opacity-90",
  outline: "border bg-transparent hover:bg-white/5",
  ghost: "bg-transparent hover:bg-white/5",
  destructive: "text-white hover:opacity-90",
};

const VARIANT_INLINE: Record<
  NonNullable<ButtonProps["variant"]>,
  React.CSSProperties
> = {
  default: { background: "var(--color-accent)", color: "#fff" },
  outline: {
    borderColor: "var(--color-border)",
    color: "var(--color-foreground)",
  },
  ghost: { color: "var(--color-foreground-muted)" },
  destructive: { background: "var(--color-danger)", color: "#fff" },
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-11 px-5 text-base rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      asChild = false,
      loading = false,
      disabled,
      className,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        disabled={disabled ?? loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium",
          "transition-hover focus-visible:outline-none",
          "disabled:opacity-50 disabled:pointer-events-none",
          "whitespace-nowrap select-none",
          VARIANT_STYLES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        style={{ ...VARIANT_INLINE[variant], ...style }}
        {...props}
      >
        {loading ? (
          <>
            <span
              className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
              aria-hidden
            />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

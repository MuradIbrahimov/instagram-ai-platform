import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
} as const;

export function Avatar({ name, imageUrl, size = "md", className }: AvatarProps) {
  const initials = getInitials(name);

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={cn("rounded-full object-cover shrink-0", SIZE_CLASSES[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full shrink-0",
        "font-medium font-mono select-none",
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        background: "color-mix(in srgb, var(--color-accent) 20%, var(--color-surface))",
        color: "var(--color-accent)",
      }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}

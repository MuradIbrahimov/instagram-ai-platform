"use client";

import { cn } from "@/lib/utils";

// ─── SkeletonLine ─────────────────────────────────────────────────────────────

interface SkeletonLineProps {
  width?: string;
  className?: string;
}

export function SkeletonLine({ width = "100%", className }: SkeletonLineProps) {
  return (
    <div
      className={cn("h-3.5 rounded animate-pulse", className)}
      style={{ width, background: "var(--color-border)" }}
    />
  );
}

// ─── SkeletonBadge ────────────────────────────────────────────────────────────

export function SkeletonBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-5 w-14 rounded-full animate-pulse", className)}
      style={{ background: "var(--color-border)" }}
    />
  );
}

// ─── SkeletonAvatar ───────────────────────────────────────────────────────────

interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AVATAR_SIZES = { sm: "size-8", md: "size-10", lg: "size-12" };

export function SkeletonAvatar({
  size = "md",
  className,
}: SkeletonAvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full animate-pulse shrink-0",
        AVATAR_SIZES[size],
        className,
      )}
      style={{ background: "var(--color-border)" }}
    />
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3 animate-pulse",
        className,
      )}
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="sm" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="50%" />
          <SkeletonLine width="30%" />
        </div>
      </div>
      <SkeletonLine />
      <SkeletonLine width="75%" />
    </div>
  );
}

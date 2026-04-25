import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

// ─── Tailwind Class Merger ────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Returns a human-readable relative date string.
 * - Today: "2:34 PM"
 * - Yesterday: "Yesterday"
 * - Within 7 days: "3 days ago"
 * - Older: "Jan 12"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Returns a full formatted timestamp.
 * e.g. "Jan 12, 2025 at 2:34 PM"
 */
export function formatTimestamp(dateString: string): string {
  return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
}

// ─── String Utilities ─────────────────────────────────────────────────────────

/**
 * Truncates a string to `maxLength` and appends "…" if needed.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}

/**
 * Returns the initials for a display name (up to 2 characters).
 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

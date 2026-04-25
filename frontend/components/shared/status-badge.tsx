import { cn } from "@/lib/utils";
import type { ConversationStatus, MessageStatus } from "@/types/api";

// ─── Conversation Status Badge ────────────────────────────────────────────────

const CONVERSATION_STATUS_CONFIG: Record<
  ConversationStatus,
  { label: string; className: string; style: React.CSSProperties }
> = {
  open: {
    label: "Open",
    className: "border font-medium",
    style: {
      background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
      borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)",
      color: "var(--color-accent)",
    },
  },
  pending: {
    label: "Pending",
    className: "border font-medium",
    style: {
      background: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
      borderColor: "color-mix(in srgb, var(--color-warning) 30%, transparent)",
      color: "var(--color-warning)",
    },
  },
  closed: {
    label: "Closed",
    className: "border font-medium",
    style: {
      background: "color-mix(in srgb, #64748b 12%, transparent)",
      borderColor: "color-mix(in srgb, #64748b 30%, transparent)",
      color: "#94a3b8",
    },
  },
  handoff: {
    label: "Handoff",
    className: "border font-medium",
    style: {
      background: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
      borderColor: "color-mix(in srgb, var(--color-danger) 30%, transparent)",
      color: "var(--color-danger)",
    },
  },
};

interface ConversationStatusBadgeProps {
  status: ConversationStatus;
  className?: string;
}

export function ConversationStatusBadge({
  status,
  className,
}: ConversationStatusBadgeProps) {
  const config = CONVERSATION_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs rounded-badge",
        config.className,
        className,
      )}
      style={config.style}
    >
      {config.label}
    </span>
  );
}

// ─── Message Status Dot ───────────────────────────────────────────────────────

const MESSAGE_STATUS_DOT: Record<MessageStatus, React.CSSProperties> = {
  received: { background: "#64748b" },
  queued: { background: "var(--color-warning)" },
  sent: { background: "var(--color-success)" },
  failed: { background: "var(--color-danger)" },
};

interface MessageStatusDotProps {
  status: MessageStatus;
  className?: string;
}

export function MessageStatusDot({ status, className }: MessageStatusDotProps) {
  return (
    <span
      className={cn("inline-block size-2 rounded-full shrink-0", className)}
      style={MESSAGE_STATUS_DOT[status]}
      aria-label={`Message status: ${status}`}
    />
  );
}

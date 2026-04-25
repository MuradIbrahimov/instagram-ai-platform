import { cn, getInitials } from "@/lib/utils";
import type { WorkspaceWithRole } from "@/types/api";
import { Button } from "@/components/ui/button";

// ─── Role Badge ───────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  owner: { label: "Owner", color: "var(--color-accent)", bg: "color-mix(in srgb, var(--color-accent) 12%, transparent)", border: "color-mix(in srgb, var(--color-accent) 25%, transparent)" },
  admin: { label: "Admin", color: "#60a5fa", bg: "color-mix(in srgb, #60a5fa 12%, transparent)", border: "color-mix(in srgb, #60a5fa 25%, transparent)" },
  agent: { label: "Agent", color: "var(--color-success)", bg: "color-mix(in srgb, var(--color-success) 12%, transparent)", border: "color-mix(in srgb, var(--color-success) 25%, transparent)" },
  viewer: { label: "Viewer", color: "#94a3b8", bg: "color-mix(in srgb, #94a3b8 12%, transparent)", border: "color-mix(in srgb, #94a3b8 25%, transparent)" },
} as const;

// ─── Workspace Avatar ─────────────────────────────────────────────────────────

const GRADIENT_PALETTE = [
  "linear-gradient(135deg, #6c63ff 0%, #3b82f6 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #f97316 0%, #eab308 100%)",
];

function workspaceGradient(name: string): string {
  const idx = name.charCodeAt(0) % GRADIENT_PALETTE.length;
  return GRADIENT_PALETTE[idx];
}

// ─── WorkspaceCard ────────────────────────────────────────────────────────────

interface WorkspaceCardProps {
  workspace: WorkspaceWithRole;
  onOpen: (workspace: WorkspaceWithRole) => void;
  className?: string;
}

export function WorkspaceCard({
  workspace,
  onOpen,
  className,
}: WorkspaceCardProps) {
  const role = ROLE_CONFIG[workspace.role];

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 rounded-card border p-5",
        "transition-all duration-150 cursor-pointer",
        "hover:-translate-y-0.5",
        "active:scale-[0.98]",
        className,
      )}
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "0 0 0 0 transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 8px 24px rgba(0,0,0,0.4)";
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "color-mix(in srgb, var(--color-accent) 40%, var(--color-border))";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 0 0 0 transparent";
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "var(--color-border)";
      }}
    >
      {/* Header: avatar + role badge */}
      <div className="flex items-start justify-between">
        <div
          className="flex size-12 items-center justify-center rounded-card text-white font-bold font-mono text-base select-none"
          style={{ background: workspaceGradient(workspace.name) }}
        >
          {getInitials(workspace.name)}
        </div>
        <span
          className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-badge border"
          style={{
            background: role.bg,
            borderColor: role.border,
            color: role.color,
          }}
        >
          {role.label}
        </span>
      </div>

      {/* Name & slug */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <h3
          className="font-semibold text-sm truncate"
          style={{ color: "var(--color-foreground)" }}
        >
          {workspace.name}
        </h3>
        <p
          className="text-xs font-mono truncate"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          {workspace.slug}
        </p>
      </div>

      {/* CTA */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(workspace);
        }}
      >
        Open workspace
      </Button>
    </div>
  );
}

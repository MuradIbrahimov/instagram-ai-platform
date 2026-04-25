export function EmptyThread() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 select-none">
      {/* Abstract geometric SVG illustration */}
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Outer circle */}
        <circle cx="48" cy="48" r="40" stroke="var(--color-border)" strokeWidth="1.5" />
        {/* Inner decorative rings */}
        <circle cx="48" cy="48" r="28" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
        {/* Message bubble shape */}
        <rect
          x="26"
          y="33"
          width="44"
          height="26"
          rx="8"
          fill="color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))"
          stroke="color-mix(in srgb, var(--color-accent) 30%, transparent)"
          strokeWidth="1.5"
        />
        {/* Bubble tail */}
        <path
          d="M34 59 L30 66 L42 60"
          fill="color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))"
          stroke="color-mix(in srgb, var(--color-accent) 30%, transparent)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Lines inside bubble */}
        <rect x="33" y="41" width="24" height="2.5" rx="1.25" fill="color-mix(in srgb, var(--color-accent) 40%, transparent)" />
        <rect x="33" y="47" width="16" height="2.5" rx="1.25" fill="color-mix(in srgb, var(--color-accent) 25%, transparent)" />
      </svg>

      <div className="text-center space-y-1">
        <p
          className="text-sm font-medium"
          style={{ color: "var(--color-foreground)" }}
        >
          Select a conversation to start
        </p>
        <p
          className="text-xs"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          Your conversations will appear here
        </p>
      </div>
    </div>
  );
}

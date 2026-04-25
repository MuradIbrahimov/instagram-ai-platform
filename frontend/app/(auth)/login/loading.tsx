export default function LoginLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Logo placeholder */}
      <div className="flex justify-center">
        <div
          className="h-7 w-20 rounded-md"
          style={{ background: "var(--color-border)" }}
        />
      </div>
      {/* Heading */}
      <div className="space-y-2 text-center">
        <div
          className="h-6 w-40 rounded-md mx-auto"
          style={{ background: "var(--color-border)" }}
        />
        <div
          className="h-4 w-56 rounded-md mx-auto"
          style={{ background: "var(--color-border)" }}
        />
      </div>
      {/* Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="h-4 w-12 rounded" style={{ background: "var(--color-border)" }} />
          <div className="h-9 w-full rounded-md" style={{ background: "var(--color-surface)" }} />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-16 rounded" style={{ background: "var(--color-border)" }} />
          <div className="h-9 w-full rounded-md" style={{ background: "var(--color-surface)" }} />
        </div>
        <div className="h-9 w-full rounded-md" style={{ background: "var(--color-border)" }} />
      </div>
    </div>
  );
}

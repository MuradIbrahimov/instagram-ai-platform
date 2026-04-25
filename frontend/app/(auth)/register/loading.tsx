export default function RegisterLoading() {
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
          className="h-6 w-48 rounded-md mx-auto"
          style={{ background: "var(--color-border)" }}
        />
        <div
          className="h-4 w-64 rounded-md mx-auto"
          style={{ background: "var(--color-border)" }}
        />
      </div>
      {/* Four fields */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-4 w-20 rounded" style={{ background: "var(--color-border)" }} />
          <div className="h-9 w-full rounded-md" style={{ background: "var(--color-surface)" }} />
        </div>
      ))}
      <div className="h-9 w-full rounded-md" style={{ background: "var(--color-border)" }} />
    </div>
  );
}

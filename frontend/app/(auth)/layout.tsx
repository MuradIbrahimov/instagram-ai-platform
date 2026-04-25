import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — geometric brand illustration */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: "var(--color-surface)" }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating blobs */}
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[96px] opacity-20"
          style={{ background: "var(--color-accent)" }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-[72px] opacity-15"
          style={{ background: "#3b82f6" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end p-12">
          <blockquote className="space-y-2">
            <p
              className="text-xl font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              &ldquo;Replyr handles our Instagram DMs 24/7. Response time went
              from hours to seconds.&rdquo;
            </p>
            <footer
              className="text-sm"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              — Growth team at a D2C brand
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="flex w-full lg:w-1/2 items-center justify-center p-8"
        style={{ background: "var(--color-background)" }}
      >
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

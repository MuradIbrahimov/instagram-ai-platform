import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Zap, Shield } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign In" };

const FEATURES = [
  {
    icon: Zap,
    text: "AI replies to Instagram DMs in under 2 seconds",
  },
  {
    icon: MessageSquare,
    text: "Natural conversations that feel 100% human",
  },
  {
    icon: Shield,
    text: "Seamless handoff to human agents when needed",
  },
] as const;

export default function LoginPage() {
  return (
    <>
      {/* Left panel override (rendered inside auth layout's left slot via CSS) */}
      {/* The auth layout renders children in the right panel. The left panel is in layout.tsx */}

      <div className="space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="space-y-1 text-center">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            Welcome back
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            Sign in to your Replyr account
          </p>
        </div>

        {/* Feature bullets (visible on mobile since left panel is hidden) */}
        <ul className="space-y-2 lg:hidden">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--color-foreground-muted)" }}>
              <Icon className="size-4 shrink-0 mt-0.5" style={{ color: "var(--color-accent)" }} />
              {text}
            </li>
          ))}
        </ul>

        <LoginForm />

        <p
          className="text-center text-sm"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium underline underline-offset-4 transition-hover"
            style={{ color: "var(--color-accent)" }}
          >
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}

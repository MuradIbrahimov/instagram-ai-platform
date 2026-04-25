import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Logo />
      </div>

      <div className="space-y-1 text-center">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--color-foreground)" }}
        >
          Create your account
        </h1>
        <p
          className="text-sm"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          Start automating your Instagram DMs in minutes
        </p>
      </div>

      <RegisterForm />

      <p
        className="text-center text-sm"
        style={{ color: "var(--color-foreground-muted)" }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium underline underline-offset-4 transition-hover"
          style={{ color: "var(--color-accent)" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

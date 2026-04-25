"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/use-auth-mutations";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Password Strength ────────────────────────────────────────────────────────

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_CONFIG = [
  { label: "", color: "var(--color-border)" },
  { label: "Weak", color: "var(--color-danger)" },
  { label: "Fair", color: "var(--color-warning)" },
  { label: "Good", color: "#60a5fa" },
  { label: "Strong", color: "var(--color-success)" },
] as const;

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const config = STRENGTH_CONFIG[strength];

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="h-1 flex-1 rounded-full transition-all duration-200"
            style={{
              background: level <= strength ? config.color : "var(--color-border)",
            }}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className="text-xs" style={{ color: config.color }}>
          {config.label}
        </p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      await registerMutation.mutateAsync({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          type="text"
          autoComplete="name"
          autoFocus
          placeholder="Jane Smith"
          error={Boolean(errors.full_name)}
          {...register("full_name")}
        />
        {errors.full_name && (
          <p className="text-xs" style={{ color: "var(--color-danger)" }}>
            {errors.full_name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs" style={{ color: "var(--color-danger)" }}>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className="pr-10"
            error={Boolean(errors.password)}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "transition-hover hover:opacity-80",
            )}
            style={{ color: "var(--color-foreground-muted)" }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        <PasswordStrengthBar password={password} />
        {errors.password && (
          <p className="text-xs" style={{ color: "var(--color-danger)" }}>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
            className="pr-10"
            error={Boolean(errors.confirm_password)}
            {...register("confirm_password")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "transition-hover hover:opacity-80",
            )}
            style={{ color: "var(--color-foreground-muted)" }}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.confirm_password && (
          <p className="text-xs" style={{ color: "var(--color-danger)" }}>
            {errors.confirm_password.message}
          </p>
        )}
      </div>

      {/* Form-level error */}
      {formError && (
        <div
          className="rounded-md border px-3 py-2 text-sm"
          style={{
            background:
              "color-mix(in srgb, var(--color-danger) 10%, transparent)",
            borderColor:
              "color-mix(in srgb, var(--color-danger) 30%, transparent)",
            color: "var(--color-danger)",
          }}
        >
          {formError}
        </div>
      )}

      <Button
        type="submit"
        size="md"
        className="w-full mt-2"
        loading={registerMutation.isPending}
      >
        Create account
      </Button>
    </form>
  );
}

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas";
import { useRegister } from "@/features/auth/hooks/useRegister";

function getPasswordStrength(password: string): { level: 0 | 1 | 2; label: string } {
  if (!password) {
    return { level: 0, label: "Weak" };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

  let score = 0;
  if (password.length >= 8) {
    score += 1;
  }
  if (password.length >= 12) {
    score += 1;
  }
  if (variety >= 3) {
    score += 1;
  }

  if (score >= 3) {
    return { level: 2, label: "Strong" };
  }
  if (score >= 2) {
    return { level: 1, label: "Medium" };
  }
  return { level: 0, label: "Weak" };
}

export function RegisterPage(): React.JSX.Element {
  const registerMutation = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const passwordValue = form.watch("password");
  const passwordStrength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  const onSubmit = form.handleSubmit((values) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        form.reset({
          full_name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      },
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" autoComplete="name" {...form.register("full_name")} />
        {form.formState.errors.full_name ? (
          <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" autoComplete="email" type="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" autoComplete="new-password" type="password" {...form.register("password")} />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
        <div className="space-y-2">
          <div className="flex gap-1">
            <div className={`h-1 flex-1 rounded ${passwordStrength.level >= 0 ? "bg-destructive/60" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded ${passwordStrength.level >= 1 ? "bg-amber-400" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded ${passwordStrength.level >= 2 ? "bg-green-500" : "bg-muted"}`} />
          </div>
          <p className="text-xs text-muted-foreground">Password strength: {passwordStrength.label}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          autoComplete="new-password"
          type="password"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {registerMutation.isPending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-medium text-primary hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}

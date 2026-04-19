import { Outlet } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export function AuthLayout(): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--accent)/0.18),transparent_35%),radial-gradient(circle_at_80%_100%,hsl(var(--primary)/0.2),transparent_30%)]" />

      <div className="relative z-10 w-full max-w-[400px] animate-fade-in-up">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Instagram AI Reply</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tenant Workspace Portal</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <Outlet />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

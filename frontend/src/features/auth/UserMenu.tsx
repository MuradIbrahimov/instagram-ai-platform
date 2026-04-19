import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const second = parts[1] ?? "";
  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
}

interface UserMenuProps {
  compact?: boolean;
}

export function UserMenu({ compact = false }: UserMenuProps): React.JSX.Element {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleSignOut = (): void => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start gap-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials(user?.full_name ?? "User")}</AvatarFallback>
          </Avatar>
          <span className={cn("truncate text-left", compact && "md:hidden")}>{user?.full_name ?? "User"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="pb-1">{user?.full_name ?? "User"}</DropdownMenuLabel>
        <p className="px-2 pb-2 text-xs text-muted-foreground">{user?.email ?? "No email available"}</p>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          Your profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

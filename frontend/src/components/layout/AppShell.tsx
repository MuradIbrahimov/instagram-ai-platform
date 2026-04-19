import { useMemo } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, Command, Inbox, Instagram, Settings } from "lucide-react";
import { WorkspaceSelector } from "@/features/workspaces/WorkspaceSelector";
import { UserMenu } from "@/features/auth/UserMenu";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AppShellProps {
  pageTitle: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ pageTitle, breadcrumbs, actions, children }: AppShellProps): React.JSX.Element {
  const location = useLocation();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const openCommandPalette = useUIStore((state) => state.openCommandPalette);
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const hasActiveWorkspace = Boolean(activeWorkspaceId);

  const navLinks = useMemo(
    () => [
      {
        label: "Conversations",
        icon: Inbox,
        to: activeWorkspaceId ? `/w/${activeWorkspaceId}/conversations` : "",
      },
      {
        label: "Instagram Accounts",
        icon: Instagram,
        to: activeWorkspaceId ? `/w/${activeWorkspaceId}/instagram` : "",
      },
      {
        label: "Knowledge Base",
        icon: BookOpen,
        to: activeWorkspaceId ? `/w/${activeWorkspaceId}/knowledge` : "",
      },
      {
        label: "Settings",
        icon: Settings,
        to: activeWorkspaceId ? `/w/${activeWorkspaceId}/settings` : "",
      },
    ],
    [activeWorkspaceId],
  );

  const sidebarWidthClass = sidebarOpen ? "md:w-[240px]" : "md:w-16";

  return (
    <div className="min-h-screen md:flex">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 transition-opacity md:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={toggleSidebar}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[240px] border-r border-border bg-background/95 px-3 py-4 backdrop-blur-md transition-transform duration-300 md:static md:z-auto md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          sidebarWidthClass,
        )}
      >
        <div className="flex h-full flex-col">
          <div className="mb-4">
            <WorkspaceSelector />
          </div>

          <Separator className="my-2" />

          <TooltipProvider>
            <nav className="flex-1 space-y-1 py-2">
              {navLinks.map((link) => {
                const baseClass = cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  !sidebarOpen && "md:justify-center md:px-2",
                );

                if (!hasActiveWorkspace) {
                  return (
                    <Tooltip key={link.label}>
                      <TooltipTrigger asChild>
                        <span className="block">
                          <div className={cn(baseClass, "pointer-events-none cursor-not-allowed text-muted-foreground/60")}>
                            <link.icon className="h-4 w-4 shrink-0" />
                            <span className={cn(!sidebarOpen && "md:hidden")}>{link.label}</span>
                          </div>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Select a workspace first</TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <NavLink
                    key={link.label}
                    to={link.to}
                    className={({ isActive }) =>
                      cn(
                        baseClass,
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      )
                    }
                  >
                    <link.icon className="h-4 w-4 shrink-0" />
                    <span className={cn(!sidebarOpen && "md:hidden")}>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </TooltipProvider>

          <Separator className="my-2" />

          <UserMenu compact={!sidebarOpen} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Button variant="outline" size="icon" onClick={toggleSidebar} className="shrink-0">
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-tight">{pageTitle}</h2>
                {breadcrumbs ? <div className="text-sm text-muted-foreground">{breadcrumbs}</div> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openCommandPalette}>
                <Command className="mr-2 h-4 w-4" />
                Command
              </Button>
              {actions}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>

        <footer className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Instagram DM AI Platform</span>
            <Link to={location.pathname}>Current route</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

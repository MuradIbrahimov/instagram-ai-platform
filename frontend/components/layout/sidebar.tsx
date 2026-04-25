"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  BookOpen,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  ChevronsUpDown,
  Instagram,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentWorkspace, useUser } from "@/stores/auth-store";
import { useLogout } from "@/hooks/use-auth-mutations";
import { Logo } from "@/components/shared/logo";
import { Avatar } from "@/components/shared/avatar";

// ─── Nav Items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "Conversations",
    href: "/conversations",
    icon: MessageSquare,
  },
  {
    label: "Knowledge Base",
    href: "/knowledge",
    icon: BookOpen,
  },
] as const;

const SETTINGS_ITEMS = [
  { label: "Accounts", href: "/settings/accounts", icon: Instagram },
  { label: "Workspace", href: "/settings/workspace", icon: Building2 },
] as const;

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const workspace = useCurrentWorkspace();
  const user = useUser();
  const logout = useLogout();

  const isSettingsActive = pathname.startsWith("/settings");
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r shrink-0",
        "transition-all duration-200 ease-in-out",
        collapsed ? "w-16" : "w-60",
        "hidden sm:flex",
      )}
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 items-center border-b shrink-0",
          collapsed ? "justify-center px-4" : "px-5",
        )}
        style={{ borderColor: "var(--color-border)" }}
      >
        {collapsed ? (
          <span
            className="text-lg font-bold font-mono"
            style={{ color: "var(--color-accent)" }}
          >
            R
          </span>
        ) : (
          <Logo size="sm" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                "transition-hover",
                isActive ? "text-white" : "hover:bg-white/5",
                collapsed && "justify-center px-2",
              )}
              style={
                isActive
                  ? {
                      background:
                        "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                      color: "var(--color-accent)",
                    }
                  : { color: "var(--color-foreground-muted)" }
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        {/* Settings collapsible group */}
        {collapsed ? (
          <Link
            href="/settings/accounts"
            className={cn(
              "flex items-center justify-center rounded-md px-2 py-2 text-sm font-medium",
              "transition-hover",
              isSettingsActive ? "" : "hover:bg-white/5",
            )}
            style={
              isSettingsActive
                ? {
                    background:
                      "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                    color: "var(--color-accent)",
                  }
                : { color: "var(--color-foreground-muted)" }
            }
            title="Settings"
          >
            <Settings2 className="size-4 shrink-0" />
          </Link>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                "transition-hover hover:bg-white/5",
              )}
              style={
                isSettingsActive
                  ? { color: "var(--color-accent)" }
                  : { color: "var(--color-foreground-muted)" }
              }
            >
              <Settings2 className="size-4 shrink-0" />
              <span className="flex-1 text-left">Settings</span>
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  settingsOpen ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>

            {settingsOpen && (
              <div className="ml-7 mt-0.5 space-y-0.5">
                {SETTINGS_ITEMS.map(({ label, href, icon: Icon }) => {
                  const isActive =
                    pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium",
                        "transition-hover",
                        isActive ? "" : "hover:bg-white/5",
                      )}
                      style={
                        isActive
                          ? {
                              background:
                                "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                              color: "var(--color-accent)",
                            }
                          : { color: "var(--color-foreground-muted)" }
                      }
                    >
                      <Icon className="size-3.5 shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Workspace switcher */}
      {workspace && (
        <button
          type="button"
          onClick={() => router.push("/workspaces")}
          className={cn(
            "flex items-center border-t mx-2 mb-1 rounded-md",
            "transition-hover hover:bg-white/5",
            collapsed ? "justify-center p-3" : "gap-2 px-3 py-3",
          )}
          style={{ borderColor: "var(--color-border)" }}
          title={collapsed ? workspace.name : "Switch workspace"}
        >
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-xs font-medium uppercase tracking-widest mb-0.5"
                  style={{ color: "var(--color-foreground-muted)" }}
                >
                  Workspace
                </p>
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {workspace.name}
                </p>
              </div>
              <ChevronsUpDown
                className="size-3.5 shrink-0"
                style={{ color: "var(--color-foreground-muted)" }}
              />
            </>
          )}
          {collapsed && (
            <ChevronsUpDown
              className="size-4"
              style={{ color: "var(--color-foreground-muted)" }}
            />
          )}
        </button>
      )}

      {/* User section */}
      <div
        className={cn(
          "flex items-center border-t p-3 shrink-0",
          collapsed ? "justify-center" : "gap-3",
        )}
        style={{ borderColor: "var(--color-border)" }}
      >
        {user && <Avatar name={user.full_name} size="sm" className="shrink-0" />}
        {!collapsed && user && (
          <>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--color-foreground)" }}
              >
                {user.full_name}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                {user.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="shrink-0 p-1 rounded-md transition-hover hover:bg-white/5"
              style={{ color: "var(--color-foreground-muted)" }}
              title="Sign out"
              type="button"
            >
              <LogOut className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-3 top-16 z-10",
          "flex size-6 items-center justify-center rounded-full border",
          "transition-hover hover:scale-110",
        )}
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          color: "var(--color-foreground-muted)",
        }}
        type="button"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="size-3" />
        ) : (
          <ChevronLeft className="size-3" />
        )}
      </button>
    </aside>
  );
}

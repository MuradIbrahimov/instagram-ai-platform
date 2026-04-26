"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MessageSquare, Settings2 } from "lucide-react";

const TABS = [
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/settings/accounts", label: "Settings", icon: Settings2 },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex sm:hidden border-t items-stretch"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
      aria-label="Mobile navigation"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors"
            aria-label={label}
            aria-current={active ? "page" : undefined}
            style={{
              color: active
                ? "var(--color-accent)"
                : "var(--color-foreground-muted)",
            }}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

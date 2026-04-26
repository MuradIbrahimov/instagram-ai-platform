import { Sidebar } from "@/components/layout/sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Topbar } from "@/components/layout/topbar";
import { DashboardGuard } from "@/components/layout/dashboard-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardGuard>
      {/* Skip to main content — visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        style={{ background: "var(--color-accent)" }}
      >
        Skip to content
      </a>

      <DashboardShell>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <Topbar />
            <main
              id="main-content"
              className="flex-1 overflow-y-auto p-6"
              style={{ background: "var(--color-background)" }}
              tabIndex={-1}
            >
              {children}
            </main>
            {/* Mobile bottom tab bar */}
            <MobileTabBar />
          </div>
        </div>
      </DashboardShell>
    </DashboardGuard>
  );
}

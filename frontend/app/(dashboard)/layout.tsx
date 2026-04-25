import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DashboardGuard } from "@/components/layout/dashboard-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main
            className="flex-1 overflow-y-auto p-6"
            style={{ background: "var(--color-background)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </DashboardGuard>
  );
}

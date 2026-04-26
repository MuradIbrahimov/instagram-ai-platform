"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { queryClient } from "@/lib/query-client";
import { CommandPalette } from "@/components/layout/command-palette";
import { useUIStore } from "@/stores/ui-store";

function CommandPaletteShortcut() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggleCommandPalette]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CommandPaletteShortcut />
      {children}
      <CommandPalette />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
          },
        }}
      />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

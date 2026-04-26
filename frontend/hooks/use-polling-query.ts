"use client";

import { useEffect, useState } from "react";

// ─── Tab visibility helper ────────────────────────────────────────────────────

function useTabVisible(): boolean {
  const [visible, setVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true,
  );

  useEffect(() => {
    const handler = () =>
      setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return visible;
}

// ─── useIsPollingActive ───────────────────────────────────────────────────────

/**
 * Returns true when the tab is visible (i.e. polling is actively running).
 * Used to show a "Live" indicator in the UI.
 */
export function useIsPollingActive(): boolean {
  return useTabVisible();
}

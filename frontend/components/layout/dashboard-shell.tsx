"use client";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsModal } from "./keyboard-shortcuts-modal";
import { OnboardingChecklist } from "./onboarding-checklist";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  return (
    <>
      {children}
      <KeyboardShortcutsModal />
      <OnboardingChecklist />
    </>
  );
}

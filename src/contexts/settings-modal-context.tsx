"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SettingsTabKey } from "@/components/profile/settings-modal/types";

interface SettingsModalContextType {
  openSettings: (tab: SettingsTabKey) => void;
  openSubscriptionModal: () => void;
}

const SettingsModalContext = createContext<SettingsModalContextType | null>(
  null,
);

export function useSettingsModal() {
  const context = useContext(SettingsModalContext);
  if (!context) {
    throw new Error(
      "useSettingsModal must be used within SettingsModalProvider",
    );
  }
  return context;
}

interface SettingsModalProviderProps {
  children: ReactNode;
  onOpenSettings: (tab: SettingsTabKey) => void;
  onOpenSubscriptionModal: () => void;
}

export function SettingsModalProvider({
  children,
  onOpenSettings,
  onOpenSubscriptionModal,
}: SettingsModalProviderProps) {
  return (
    <SettingsModalContext.Provider
      value={{
        openSettings: onOpenSettings,
        openSubscriptionModal: onOpenSubscriptionModal,
      }}
    >
      {children}
    </SettingsModalContext.Provider>
  );
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type ChatMode = "property-search" | "document-support" | null;

interface ChatModeContextValue {
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  toggleMode: (mode: ChatMode) => void;
  getModeLabel: () => string | null;
  getPlaceholder: () => string;
}

const ChatModeContext = createContext<ChatModeContextValue | null>(null);

export function ChatModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ChatMode>(null);

  const toggleMode = useCallback((newMode: ChatMode) => {
    setMode((current) => (current === newMode ? null : newMode));
  }, []);

  const getModeLabel = useCallback(() => {
    switch (mode) {
      case "property-search":
        return "物件を探す";
      case "document-support":
        return "文書作成支援";
      default:
        return null;
    }
  }, [mode]);

  const getPlaceholder = useCallback(() => {
    switch (mode) {
      case "property-search":
        return "どのような物件をお探しですか？";
      case "document-support":
        return "どのような文書を作成しますか？";
      default:
        return "タスクを割り当てるか、何でも質問してください";
    }
  }, [mode]);

  return (
    <ChatModeContext.Provider
      value={{ mode, setMode, toggleMode, getModeLabel, getPlaceholder }}
    >
      {children}
    </ChatModeContext.Provider>
  );
}

export function useChatMode() {
  const context = useContext(ChatModeContext);
  if (!context) {
    throw new Error("useChatMode must be used within a ChatModeProvider");
  }
  return context;
}


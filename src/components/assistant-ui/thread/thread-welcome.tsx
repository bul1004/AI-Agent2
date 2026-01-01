"use client";

import type { FC } from "react";
import { ThreadPrimitive } from "@assistant-ui/react";
import { Building2, FileText } from "lucide-react";
import { Composer } from "@/components/assistant-ui/thread/composer";
import { useChatMode, type ChatMode } from "@/contexts/chat-mode-context";
import { cn } from "@/lib/utils";

const ModeButton: FC<{
  mode: ChatMode;
  icon: React.ReactNode;
  label: string;
}> = ({ mode, icon, label }) => {
  const { mode: currentMode, toggleMode } = useChatMode();
  const isActive = currentMode === mode;

  return (
    <button
      onClick={() => toggleMode(mode)}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all text-sm font-medium",
        isActive
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background hover:bg-muted text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex h-full w-full max-w-[var(--thread-max-width)] flex-col items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center gap-8 mb-12">
          <h1 className="text-3xl md:text-4xl tracking-tight text-center font-sans-jp">
            何をお手伝いしましょうか？
          </h1>
          <div className="w-full">
            <Composer />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ModeButton
              mode="property-search"
              icon={<Building2 className="size-4" />}
              label="物件を探す"
            />
            <ModeButton
              mode="document-comparison"
              icon={<FileText className="size-4" />}
              label="重要事項説明書の登記情報確認"
            />
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};

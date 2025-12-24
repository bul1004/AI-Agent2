"use client";

import type { FC } from "react";
import {
  ComposerPrimitive,
  ThreadPrimitive,
  useComposerRuntime,
} from "@assistant-ui/react";
import { ArrowUp, Mic, Plus, Square, X, Building2, FileText } from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useEffect, useState } from "react";
import { useChatMode } from "@/contexts/chat-mode-context";
import { cn } from "@/lib/utils";

export const Composer: FC = () => {
  const composer = useComposerRuntime();
  const [hasText, setHasText] = useState(false);
  const { mode, toggleMode, getModeLabel, getPlaceholder } = useChatMode();
  const [isChipHovered, setIsChipHovered] = useState(false);

  useEffect(() => {
    const unsubscribe = composer.subscribe(() => {
      setHasText(composer.getState().text.trim().length > 0);
    });
    return unsubscribe;
  }, [composer]);

  const ModeIcon = mode === "property-search" ? Building2 : FileText;

  return (
    <ComposerPrimitive.Root className="focus-within:border-ring/30 flex w-full flex-col rounded-3xl border border-border/80 bg-inherit shadow-sm transition-colors ease-in overflow-hidden">
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder={getPlaceholder()}
        className="placeholder:text-muted-foreground/60 min-h-[60px] flex-grow resize-none border-none bg-transparent px-5 py-5 text-base outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full border border-border/60 bg-transparent transition-colors hover:bg-muted/50"
          >
            <Plus className="size-4 text-muted-foreground" />
          </button>

          {mode && (
            <div
              className="relative group flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-blue-600 transition-all hover:bg-blue-100/50 cursor-default"
              onMouseEnter={() => setIsChipHovered(true)}
              onMouseLeave={() => setIsChipHovered(false)}
            >
              <ModeIcon className="size-3.5" />
              <span className="text-sm font-medium leading-none">{getModeLabel()}</span>
              {isChipHovered && (
                <button
                  onClick={() => toggleMode(mode)}
                  className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-transform hover:scale-110"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipIconButton
            tooltip="音声入力"
            variant="ghost"
            className="size-10 p-2 rounded-full hover:bg-muted/50"
          >
            <Mic className="size-5 text-muted-foreground" />
          </TooltipIconButton>
          <ThreadPrimitive.If running={false}>
            <ComposerPrimitive.Send asChild>
              <TooltipIconButton
                tooltip="送信"
                variant="default"
                disabled={!hasText}
                className={cn(
                  "size-10 p-2 rounded-full transition-all border-none",
                  hasText
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <ArrowUp className="size-5" />
              </TooltipIconButton>
            </ComposerPrimitive.Send>
          </ThreadPrimitive.If>
          <ThreadPrimitive.If running>
            <ComposerPrimitive.Cancel asChild>
              <TooltipIconButton
                tooltip="キャンセル"
                variant="default"
                className="size-10 p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Square className="size-5" />
              </TooltipIconButton>
            </ComposerPrimitive.Cancel>
          </ThreadPrimitive.If>
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
};

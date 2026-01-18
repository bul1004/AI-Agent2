"use client";

import type { FC } from "react";
import {
  ComposerPrimitive,
  ThreadPrimitive,
  useComposerRuntime,
} from "@assistant-ui/react";
import { ArrowUp, Mic, Plus, Square, X, Building2, FileText, Loader2 } from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useEffect, useState, useRef } from "react";
import { useChatMode } from "@/contexts/chat-mode-context";
import { useOrganization } from "@/hooks/use-organization";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Composer: FC = () => {
  const composer = useComposerRuntime();
  const [hasText, setHasText] = useState(false);
  const { mode, toggleMode, getModeLabel, getPlaceholder } = useChatMode();
  const [isChipHovered, setIsChipHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentOrg } = useOrganization();

  useEffect(() => {
    const unsubscribe = composer.subscribe(() => {
      setHasText(composer.getState().text.trim().length > 0);
    });
    return unsubscribe;
  }, [composer]);

  const ModeIcon = mode === "property-search" ? Building2 : FileText;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // PDFファイルの検証
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("PDFファイルのみアップロードできます");
      return;
    }

    // ファイルサイズの検証（50MB制限）
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("ファイルサイズが大きすぎます（最大50MB）");
      return;
    }

    if (!currentOrg?.id) {
      toast.error("組織が選択されていません");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", currentOrg.id);

      const response = await fetch("/api/upload/pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "アップロードに失敗しました" }));
        throw new Error(error.error || "アップロードに失敗しました");
      }

      const result = await response.json();
      toast.success(`PDFをアップロードしました: ${file.name}`);

      // メッセージにPDF情報を追加（オプション）
      const currentText = composer.getState().text;
      const pdfInfo = `\n[PDF: ${file.name}](${result.document?.fileUrl || ""})`;
      composer.setText(currentText + pdfInfo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "アップロードに失敗しました";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      // ファイル入力のリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <ComposerPrimitive.Root className="focus-within:border-ring/30 flex w-full flex-col rounded-3xl border border-border/80 bg-inherit shadow-sm transition-colors ease-in overflow-hidden">
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder={getPlaceholder()}
        className="placeholder:text-muted-foreground/60 min-h-[60px] grow resize-none border-none bg-transparent px-5 py-5 text-base outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <TooltipIconButton
            tooltip={isUploading ? "アップロード中..." : "PDFをアップロード"}
            variant="ghost"
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading || !currentOrg?.id}
            className="size-8 rounded-full border border-border/60 bg-transparent transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="size-4 text-muted-foreground animate-spin" />
            ) : (
              <Plus className="size-4 text-muted-foreground" />
            )}
          </TooltipIconButton>

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

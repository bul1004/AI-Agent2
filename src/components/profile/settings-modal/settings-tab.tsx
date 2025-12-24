"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/profile/settings-modal/section-header";
import { ThemeCard } from "@/components/profile/settings-modal/theme-card";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SettingsTab() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("ja");

  return (
    <div>
      <SectionHeader title="設定" />

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-semibold text-sm mb-3">
            一般
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground">言語</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full sm:w-[280px] bg-background border px-3.5 py-5 rounded-lg h-auto text-sm font-medium transition-all hover:bg-muted/50">
                <SelectValue placeholder="言語を選択" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-xl border p-1">
                <SelectItem
                  value="ja"
                  className="rounded-md py-2.5 font-medium"
                >
                  日本語
                </SelectItem>
                <SelectItem
                  value="en"
                  className="rounded-md py-2.5 font-medium"
                >
                  English
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-5">
          <div className="font-semibold text-sm">外観</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 font-medium">
            <ThemeCard
              selected={theme === "light"}
              onClick={() => setTheme("light")}
              icon={<Sun className="h-5 w-5" />}
              label="ライト"
              preview={
                <div className="h-full w-full bg-white flex gap-1.5 p-2">
                  <div className="w-1/4 h-full bg-gray-100 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 w-full bg-gray-100 rounded" />
                    <div className="h-2 w-2/3 bg-gray-100 rounded" />
                    <div className="h-2 w-1/2 bg-gray-100 rounded" />
                  </div>
                </div>
              }
            />
            <ThemeCard
              selected={theme === "dark"}
              onClick={() => setTheme("dark")}
              icon={<Moon className="h-5 w-5" />}
              label="ダーク"
              preview={
                <div className="h-full w-full bg-[#0a0a0a] flex gap-1.5 p-2">
                  <div className="w-1/4 h-full bg-zinc-800 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 w-full bg-zinc-800 rounded" />
                    <div className="h-2 w-2/3 bg-zinc-800 rounded" />
                    <div className="h-2 w-1/2 bg-zinc-800 rounded" />
                  </div>
                </div>
              }
            />
            <ThemeCard
              selected={theme === "system"}
              onClick={() => setTheme("system")}
              icon={<Monitor className="h-5 w-5" />}
              label="システムに従う"
              preview={
                <div className="h-full w-full bg-gradient-to-br from-white to-[#0a0a0a] flex gap-1.5 p-2">
                  <div className="w-1/4 h-full bg-white/40 backdrop-blur-sm rounded" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 w-full bg-white/30 rounded" />
                    <div className="h-2 w-2/3 bg-white/30 rounded" />
                    <div className="h-2 w-1/2 bg-white/30 rounded" />
                  </div>
                </div>
              }
            />
          </div>
        </div>

        <div className="space-y-5 pt-6 border-t">
          <div className="text-sm font-semibold">パーソナライゼーション</div>

          <div className="flex items-start justify-between py-3 group cursor-pointer gap-4">
            <div className="space-y-1 flex-1">
              <div className="font-medium text-sm text-foreground">
                限定コンテンツを受け取る
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                限定オファー、イベント更新情報、優れたケーススタディ、新機能ガイドを入手。
              </p>
            </div>
            <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors">
              <span className="pointer-events-none block h-4 w-4 translate-x-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200" />
            </div>
          </div>

          <div className="flex items-start justify-between py-3 group cursor-pointer gap-4">
            <div className="space-y-1 flex-1">
              <div className="font-medium text-sm text-foreground">
                キューに入っているタスクが処理を開始したらメールで通知してください
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                有効にすると、タスクがキューを終了して処理を開始した際にメールでお知らせしますので、進捗状況を簡単に確認できます。この設定はいつでも変更可能です。
              </p>
            </div>
            <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors">
              <span className="pointer-events-none block h-4 w-4 translate-x-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t">
          <div className="flex items-center justify-between p-5 rounded-xl bg-muted/30 border">
            <div className="font-medium text-sm text-foreground">
              クッキーを管理
            </div>
            <Button
              variant="outline"
              className="bg-background hover:bg-muted/50 font-medium px-5 py-2 h-auto rounded-lg text-sm transition-all"
            >
              管理
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

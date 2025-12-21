"use client";

import { Globe, Monitor, Moon, Sun } from "lucide-react";
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
      <SectionHeader title="設定" description="外観と言語の好みを設定します" />

      <div className="space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-bold text-lg mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <span>一般</span>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-bold text-muted-foreground ml-1">
              言語
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full sm:w-[280px] bg-muted/30 border-2 border-transparent hover:border-muted-foreground/20 px-4 py-6 rounded-2xl h-auto text-base font-medium transition-all">
                <SelectValue placeholder="言語を選択" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl border-none p-2 translate-y-2">
                <SelectItem value="ja" className="rounded-xl py-3 font-medium">
                  日本語
                </SelectItem>
                <SelectItem value="en" className="rounded-xl py-3 font-medium">
                  English
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Sun className="h-5 w-5 text-primary" />
            <span>外観</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-medium">
            <ThemeCard
              selected={theme === "light"}
              onClick={() => setTheme("light")}
              icon={<Sun className="h-6 w-6" />}
              label="ライト"
              preview={
                <div className="h-full w-full bg-[#f8fafc] border rounded-t-lg mt-2 flex gap-1 p-2">
                  <div className="w-1/4 h-full bg-white border border-gray-100 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full bg-gray-100 rounded" />
                    <div className="h-3 w-2/3 bg-gray-100 rounded" />
                  </div>
                </div>
              }
            />
            <ThemeCard
              selected={theme === "dark"}
              onClick={() => setTheme("dark")}
              icon={<Moon className="h-6 w-6" />}
              label="ダーク"
              preview={
                <div className="h-full w-full bg-[#0f172a] border border-gray-800 rounded-t-lg mt-2 flex gap-1 p-2">
                  <div className="w-1/4 h-full bg-slate-800 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full bg-slate-800 rounded" />
                    <div className="h-3 w-2/3 bg-slate-800 rounded" />
                  </div>
                </div>
              }
            />
            <ThemeCard
              selected={theme === "system"}
              onClick={() => setTheme("system")}
              icon={<Monitor className="h-6 w-6" />}
              label="システムに従う"
              preview={
                <div className="h-full w-full bg-gradient-to-r from-gray-50 to-gray-900 border rounded-t-lg mt-2 relative overflow-hidden flex gap-1 p-2">
                  <div className="w-1/4 h-full bg-white/50 backdrop-blur rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full bg-white/30 rounded" />
                    <div className="h-3 w-2/3 bg-white/30 rounded" />
                  </div>
                </div>
              }
            />
          </div>
        </div>

        <div className="space-y-4 pt-10 border-t border-border/50">
          <div className="text-sm font-bold text-muted-foreground tracking-wider uppercase mb-4">
            パーソナライゼーション
          </div>

          <div className="flex items-center justify-between py-2 group cursor-pointer">
            <div className="space-y-1">
              <div className="font-bold text-foreground">
                限定コンテンツを受け取る
              </div>
              <p className="text-sm text-muted-foreground">
                限定オファー、イベント更新情報、優れたケーススタディ、新機能ガイドを入手。
              </p>
            </div>
            <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <span className="pointer-events-none block h-5 w-5 translate-x-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200" />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 group cursor-pointer">
            <div className="space-y-1">
              <div className="font-bold text-foreground truncate max-w-md">
                キューに入っているタスクが処理を開始したらメールで通知してください
              </div>
              <p className="text-sm text-muted-foreground">
                有効にすると、タスクがキューを終了して処理を開始した際にメールでお知らせしますので、進捗状況を簡単に確認できます。この設定はいつでも変更可能です。
              </p>
            </div>
            <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors">
              <span className="pointer-events-none block h-5 w-5 translate-x-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200" />
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-border/50">
          <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/20 border border-muted-foreground/10">
            <div className="font-bold text-foreground">クッキーを管理</div>
            <Button
              variant="outline"
              className="bg-background border-2 hover:bg-muted font-bold px-6 py-6 h-auto rounded-2xl transition-all"
            >
              管理
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

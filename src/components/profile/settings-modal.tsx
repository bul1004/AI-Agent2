"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { SidebarItem } from "@/components/profile/settings-modal/sidebar-item";
import { AccountTab } from "@/components/profile/settings-modal/account-tab";
import { SettingsTab } from "@/components/profile/settings-modal/settings-tab";
import { UsageTab } from "@/components/profile/settings-modal/usage-tab";
import { HelpTab } from "@/components/profile/settings-modal/help-tab";
import type { SettingsTabKey } from "@/components/profile/settings-modal/types";

const tabTitles: Record<SettingsTabKey, string> = {
  account: "アカウント",
  settings: "設定",
  usage: "使用状況",
  recurring: "定期タスク",
  mail: "Mail Manus",
  data: "データ管理",
  browser: "クラウドブラウザ",
  connector: "コネクタ",
  integration: "統合",
  help: "ヘルプを取得",
};

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: SettingsTabKey;
}

export function SettingsModal({
  open,
  onOpenChange,
  initialTab = "account",
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabKey>(initialTab);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/20 backdrop-blur-[2px]" />
        <DialogContent className="max-w-[800px] h-[600px] p-0 gap-0 rounded-[24px] shadow-2xl overflow-hidden flex border-0 [&>button]:hidden outline-none">
          <DialogTitle className="sr-only">{tabTitles[activeTab]}</DialogTitle>

          {/* Sidebar */}
          <div className="w-[190px] border-r border-border/40 flex flex-col bg-[#fdfdfd] shrink-0">
            <div className="p-4 px-3.5">
              <div className="flex items-center gap-2 mb-6 px-1">
                <div className="h-6 w-6 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-foreground"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    <path d="M5 3v4" />
                    <path d="M19 17v4" />
                    <path d="M3 5h4" />
                    <path d="M17 19h4" />
                  </svg>
                </div>
                <span className="font-bold text-[18px] tracking-tight text-foreground">
                  manus
                </span>
              </div>

              <nav className="space-y-1">
                <SidebarItem
                  iconLabel="account"
                  label="アカウント"
                  active={activeTab === "account"}
                  onClick={() => setActiveTab("account")}
                />
                <SidebarItem
                  iconLabel="settings"
                  label="設定"
                  active={activeTab === "settings"}
                  onClick={() => setActiveTab("settings")}
                />
                <SidebarItem
                  iconLabel="usage"
                  label="使用状況"
                  active={activeTab === "usage"}
                  onClick={() => setActiveTab("usage")}
                />
                <SidebarItem
                  iconLabel="recurring"
                  label="定期タスク"
                  active={activeTab === "recurring"}
                  onClick={() => setActiveTab("recurring")}
                />
                <SidebarItem
                  iconLabel="mail"
                  label="Mail Manus"
                  active={activeTab === "mail"}
                  onClick={() => setActiveTab("mail")}
                />
                <SidebarItem
                  iconLabel="data"
                  label="データ管理"
                  active={activeTab === "data"}
                  onClick={() => setActiveTab("data")}
                />
                <SidebarItem
                  iconLabel="browser"
                  label="クラウドブラウザ"
                  active={activeTab === "browser"}
                  onClick={() => setActiveTab("browser")}
                />
                <SidebarItem
                  iconLabel="connector"
                  label="コネクタ"
                  active={activeTab === "connector"}
                  onClick={() => setActiveTab("connector")}
                />
                <SidebarItem
                  iconLabel="integration"
                  label="統合"
                  active={activeTab === "integration"}
                  onClick={() => setActiveTab("integration")}
                />
              </nav>
            </div>

            <div className="mt-auto p-4 px-3.5 pb-6">
              <SidebarItem
                iconLabel="help"
                label="ヘルプを取得"
                active={activeTab === "help"}
                onClick={() => setActiveTab("help")}
                showChevron
                muted
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto relative bg-white">
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="rounded-full h-8 w-8 hover:bg-muted text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">閉じる</span>
              </Button>
            </div>

            <div className="p-8 px-8 min-h-full">
              <div className="max-w-full mx-auto">
                {activeTab === "account" && <AccountTab user={user} />}
                {activeTab === "settings" && <SettingsTab />}
                {activeTab === "usage" && <UsageTab />}
                {activeTab === "help" && <HelpTab />}
                {/* Missing tabs show a coming soon or the component if it existed */}
                {!["account", "settings", "usage", "help"].includes(
                  activeTab
                ) && (
                  <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                    <p className="text-sm font-medium">Coming Soon</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

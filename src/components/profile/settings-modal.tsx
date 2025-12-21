"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { SidebarItem } from "@/components/profile/settings-modal/sidebar-item";
import { AccountTab } from "@/components/profile/settings-modal/account-tab";
import { SettingsTab } from "@/components/profile/settings-modal/settings-tab";
import { UsageTab } from "@/components/profile/settings-modal/usage-tab";
import { HelpTab } from "@/components/profile/settings-modal/help-tab";
import type { SettingsTabKey } from "@/components/profile/settings-modal/types";

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
        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
        <DialogContent className="max-w-5xl h-[80vh] min-h-[600px] p-0 gap-0 rounded-[32px] shadow-2xl overflow-hidden flex border [&>button]:hidden">
          <div className="w-72 border-r flex flex-col bg-muted/20">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-primary-foreground font-black italic text-xl">
                    M
                  </span>
                </div>
                <span className="font-bold text-2xl tracking-tight text-foreground">
                  manus
                </span>
              </div>

              <nav className="space-y-1.5">
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
              </nav>
            </div>

            <div className="mt-auto p-8 space-y-4">
              <div className="h-px bg-border/60" />
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

          <div className="flex-1 overflow-y-auto relative bg-background/50 backdrop-blur-3xl">
            <div className="absolute top-8 right-8 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="rounded-full h-10 w-10 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-6 w-6" />
                <span className="sr-only">閉じる</span>
              </Button>
            </div>

            <div className="p-12 max-w-3xl mx-auto min-h-full">
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === "account" && <AccountTab user={user} />}
                {activeTab === "settings" && <SettingsTab />}
                {activeTab === "usage" && <UsageTab />}
                {activeTab === "help" && <HelpTab />}
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

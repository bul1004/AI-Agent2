"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import {
  Settings,
  LogOut,
  HelpCircle,
  Home,
  Sparkles,
  User,
  ChevronRight,
} from "lucide-react";
import { SettingsModal } from "@/components/profile/settings-modal";
import { SubscriptionModal } from "@/components/billing/subscription-modal";
import { ProfileMenuItem } from "@/components/profile/profile-menu-item";

interface ProfileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileMenu({ isOpen, onOpenChange }: ProfileMenuProps) {
  const { user, logout } = useAuth();
  const { plan, planDetails } = useSubscription();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<
    "account" | "settings" | "usage" | "help"
  >("account");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  if (!isOpen) return null;

  const isPaidPlan = plan !== "free";

  const openSettings = (tab: "account" | "settings" | "usage" | "help") => {
    setInitialTab(tab);
    setIsSettingsOpen(true);
    onOpenChange(false);
  };

  return (
    <>
      {/* Menu */}
      <div
        className="absolute top-full right-0 z-50 pt-2"
        onMouseEnter={() => onOpenChange(true)}
      >
        <div className="w-[340px] rounded-2xl border bg-background shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="p-4 space-y-2">
            {/* User Profile Section */}
            <button
              onClick={() => openSettings("account")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-primary overflow-hidden flex items-center justify-center text-primary-foreground">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user?.name || "User"}
                    width={40}
                    height={40}
                    sizes="40px"
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-base">{user?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {user?.email}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="border-t" />

            {/* Plan & Credits Section */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <div className="text-base font-semibold">
                  {isPaidPlan ? planDetails.name : "無料"}
                </div>
                <button
                  onClick={() => {
                    setShowSubscriptionModal(true);
                    onOpenChange(false);
                  }}
                  className="px-4 py-1.5 bg-foreground text-background text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
                >
                  アップグレード
                </button>
              </div>

              <button
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background/80 transition-colors"
                onClick={() => openSettings("usage")}
              >
                <Sparkles className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">クレジット</div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-base font-semibold">
                    {isPaidPlan ? "∞" : planDetails.limits.messagesPerMonth}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            </div>

            <div className="border-t" />

            {/* Menu Items */}
            <div className="space-y-1">
              <ProfileMenuItem
                icon={<Settings className="h-5 w-5" />}
                label="設定"
                onClick={() => openSettings("settings")}
              />
              <ProfileMenuItem
                icon={<Home className="h-5 w-5" />}
                label="ホームページ"
                onClick={() => {
                  router.push("/");
                  onOpenChange(false);
                }}
                showArrow
              />
              <ProfileMenuItem
                icon={<HelpCircle className="h-5 w-5" />}
                label="ヘルプを取得"
                onClick={() => openSettings("help")}
                showArrow
              />
            </div>

            <div className="border-t" />

            {/* Logout */}
            <ProfileMenuItem
              icon={<LogOut className="h-5 w-5" />}
              label="サインアウト"
              onClick={() => {
                logout();
                onOpenChange(false);
              }}
              variant="destructive"
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        initialTab={initialTab}
      />
      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </>
  );
}

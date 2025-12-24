"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useOrganization } from "@/hooks/use-organization";
import {
  Settings,
  LogOut,
  HelpCircle,
  Home,
  User,
  ArrowLeftRight,
  Check,
  Plus,
  Building2,
} from "lucide-react";
import { ProfileMenuItem } from "@/components/profile/profile-menu-item";
import { CreateOrgModal } from "@/components/organization/create-org-modal";
import type { SettingsTabKey } from "@/components/profile/settings-modal/types";

interface ProfileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: (tab: SettingsTabKey) => void;
  onOpenSubscriptionModal: () => void;
}

export function ProfileMenu({
  isOpen,
  onOpenChange,
  onOpenSettings,
  onOpenSubscriptionModal,
}: ProfileMenuProps) {
  const { user, logout } = useAuth();
  const { plan, planDetails } = useSubscription();
  const { organizations, currentOrg, switchOrg } = useOrganization();
  const router = useRouter();
  const [isOrgSubmenuOpen, setIsOrgSubmenuOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);

  if (!isOpen && !isCreateOrgModalOpen) return null;

  const isPaidPlan = plan !== "none";

  const handleSwitchOrg = async (orgId: string | null) => {
    await switchOrg(orgId);
    setIsOrgSubmenuOpen(false);
    router.refresh();
  };

  const handleCreateTeam = () => {
    setIsOrgSubmenuOpen(false);
    onOpenChange(false);
    setIsCreateOrgModalOpen(true);
  };

  const handleOpenSettings = (tab: SettingsTabKey) => {
    onOpenSettings(tab);
    onOpenChange(false);
  };

  return (
    <>
      {/* Create Organization Modal */}
      <CreateOrgModal
        open={isCreateOrgModalOpen}
        onOpenChange={setIsCreateOrgModalOpen}
      />

      {/* Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 z-50 pt-2"
          onMouseEnter={() => onOpenChange(true)}
        >
          <div className="w-[340px] rounded-2xl border bg-background shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-4 space-y-2">
              {/* Current Account Section - Shows org or personal profile */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenSettings("account")}
                  className="flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                  data-testid="profile-menu-account"
                >
                  {currentOrg ? (
                    <>
                      <div className="h-10 w-10 rounded-xl bg-muted overflow-hidden flex items-center justify-center text-muted-foreground">
                        {currentOrg.logo ? (
                          <Image
                            src={currentOrg.logo}
                            alt={currentOrg.name}
                            width={40}
                            height={40}
                            sizes="40px"
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-base truncate">
                          {currentOrg.name}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          チーム
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-base truncate">
                          {user?.name}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {user?.email}
                        </div>
                      </div>
                    </>
                  )}
                </button>

                {/* Organization Switcher Button */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsOrgSubmenuOpen(true)}
                  onMouseLeave={() => setIsOrgSubmenuOpen(false)}
                >
                  <button
                    className="p-2 rounded-lg hover:bg-muted transition-colors group"
                    title="アカウントを切り替える"
                  >
                    <ArrowLeftRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>

                  {/* Organization Submenu */}
                  {isOrgSubmenuOpen && (
                    <div className="absolute right-full top-0 pr-2 z-50">
                      <div className="w-[280px] rounded-xl border bg-background shadow-xl animate-in fade-in-0 slide-in-from-right-2 duration-150">
                        <div className="p-2">
                          <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            アカウントを切り替える
                          </div>

                          {/* Personal Account (no organization) */}
                          <button
                            onClick={() => handleSwitchOrg(null)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="h-8 w-8 rounded-full bg-primary overflow-hidden flex items-center justify-center text-primary-foreground">
                              {user?.image ? (
                                <Image
                                  src={user.image}
                                  alt={user?.name || "User"}
                                  width={32}
                                  height={32}
                                  sizes="32px"
                                  unoptimized
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="text-sm font-medium truncate">
                                {user?.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                個人
                              </div>
                            </div>
                            {!currentOrg && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </button>

                          {/* Organization List */}
                          {organizations.map((org) => (
                            <button
                              key={org.id}
                              onClick={() => handleSwitchOrg(org.id)}
                              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                <span className="text-sm font-medium">
                                  {org.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {org.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  チーム
                                </div>
                              </div>
                              {currentOrg?.id === org.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </button>
                          ))}

                          <div className="my-1 h-px bg-border" />

                          {/* Create Team Button */}
                          <button
                            onClick={handleCreateTeam}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-sm font-medium">
                              チームを作成
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t" />

              {/* Plan & Credits Section */}
              <div className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold">
                    {isPaidPlan ? planDetails.name : "無料"}
                  </div>
                  <button
                    onClick={() => {
                      onOpenSubscriptionModal();
                      onOpenChange(false);
                    }}
                    className="px-4 py-1.5 bg-foreground text-background text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
                  >
                    アップグレード
                  </button>
                </div>
              </div>

              <div className="border-t" />

              {/* Menu Items */}
              <div className="space-y-1">
                <ProfileMenuItem
                  icon={<Settings className="h-5 w-5" />}
                  label="設定"
                  onClick={() => handleOpenSettings("settings")}
                  data-testid="profile-menu-settings"
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
                  onClick={() => handleOpenSettings("help")}
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
      )}
    </>
  );
}

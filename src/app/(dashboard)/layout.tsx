"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Settings,
  LogOut,
  Loader2,
  Search,
  Sparkles,
  HelpCircle,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
  Check,
  Plus,
  Building2,
  ChevronsUpDown,
  Library,
  FolderPlus,
  ChevronDown,
  LayoutGrid,
  Menu,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { MastraRuntimeProvider } from "@/app/MastraRuntimeProvider";
import { SettingsModalProvider } from "@/contexts/settings-modal-context";
import { CreateOrgModal } from "@/components/organization/create-org-modal";
import { useSubscription } from "@/hooks/use-subscription";
import { ProfileAvatarButton } from "@/components/profile/profile-avatar-button";

const SettingsModal = dynamic(
  () =>
    import("@/components/profile/settings-modal").then(
      (mod) => mod.SettingsModal,
    ),
  { ssr: false },
);

const SubscriptionModal = dynamic(
  () =>
    import("@/components/billing/subscription-modal").then(
      (mod) => mod.SubscriptionModal,
    ),
  { ssr: false },
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { organizations, currentOrg, switchOrg } = useOrganization();
  const { planDetails } = useSubscription();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialTab, setInitialTab] =
    useState<
      import("@/components/profile/settings-modal/types").SettingsTabKey
    >("account");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSwitchOrg = async (orgId: string | null) => {
    await switchOrg(orgId);
    router.refresh();
  };

  const openSettings = (
    tab: import("@/components/profile/settings-modal/types").SettingsTabKey,
  ) => {
    setInitialTab(tab);
    setIsSettingsOpen(true);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MastraRuntimeProvider>
      <SettingsModalProvider
        onOpenSettings={openSettings}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
      >
        <div className="flex h-screen overflow-hidden relative">
          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={cn(
              "flex flex-col border-r bg-white dark:bg-neutral-950 transition-all duration-300 ease-in-out",
              "fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0",
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
              isCollapsed ? "lg:w-[60px]" : "lg:w-[260px]",
              "w-[260px]" // Mobile width
            )}
          >
            <div className="flex items-center justify-between p-3 pb-4">
              <div
                className={cn(
                  "flex items-center gap-2 px-1",
                  (isCollapsed && !isMobileMenuOpen) && "lg:justify-center lg:w-full",
                )}
              >
                <div className="flex h-7 w-7 items-center justify-center text-neutral-900 dark:text-neutral-100 shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                  </svg>
                </div>
                {(!isCollapsed || isMobileMenuOpen) && (
                  <span className="font-serif font-bold text-2xl tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
                    gibberish
                  </span>
                )}
              </div>
              <div className="flex items-center">
                {(!isCollapsed && !isMobileMenuOpen) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hidden lg:flex"
                    onClick={() => setIsCollapsed(true)}
                  >
                    <PanelLeftClose className="h-5 w-5" />
                  </Button>
                )}
                {isMobileMenuOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="px-2 space-y-0.5">
              {/* New Task */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-2 h-9 text-[14px] font-normal transition-colors duration-200 bg-neutral-100 dark:bg-neutral-800 rounded-lg",
                  "hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100",
                  isCollapsed ? "justify-center px-0" : "",
                )}
                onClick={() => {
                  // Logic to start new task
                  setIsMobileMenuOpen(false);
                }}
              >
                <SquarePen className="h-4 w-4" />
                {!isCollapsed && <span className="flex-1 text-left">新規チャット</span>}
              </Button>

              {/* Search */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-2 h-7.5 text-[14px] font-normal text-neutral-900 dark:text-neutral-100 transition-colors duration-200",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  isCollapsed ? "justify-center px-0" : "",
                )}
              >
                <Search className="h-4 w-4" />
                {!isCollapsed && <span>検索</span>}
              </Button>

              {/* Library */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-2 h-7.5 text-[14px] font-normal text-neutral-900 dark:text-neutral-100 transition-colors duration-200",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  isCollapsed ? "justify-center px-0" : "",
                )}
              >
                <Library className="h-4 w-4" />
                {!isCollapsed && <span>ライブラリ</span>}
              </Button>
            </div>

            <div className="mt-4 px-2">
              {!isCollapsed && (
                <div 
                  className="flex items-center justify-start gap-1 text-[14px] font-normal text-neutral-400 mb-1 px-2 cursor-pointer group"
                  onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                >
                  <span>プロジェクト</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", !isProjectsOpen && "-rotate-90")} />
                </div>
              )}
              
              {(!isCollapsed && isProjectsOpen) && (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 px-2 h-7.5 text-[14px] font-normal text-neutral-900 dark:text-neutral-100 transition-colors duration-200",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    isCollapsed ? "justify-center px-0" : "",
                  )}
                >
                  <FolderPlus className="h-4 w-4" />
                  {!isCollapsed && <span>新しいプロジェクト</span>}
                </Button>
              )}
            </div>

            <div className="mt-1 flex-1 overflow-y-auto overflow-x-hidden px-2 py-1">
              {!isCollapsed && (
                <div 
                  className="flex items-center justify-start gap-1 text-[14px] font-normal text-neutral-400 mb-1 px-2 cursor-pointer group"
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                >
                  <span>チャット履歴</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", !isHistoryOpen && "-rotate-90")} />
                </div>
              )}
              
              {(!isCollapsed && isHistoryOpen) && (
                <div className="mt-1">
                  <ThreadList />
                </div>
              )}
            </div>

            <div className="border-t px-2 py-2">
              {isCollapsed ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-full justify-center"
                  onClick={() => setIsCollapsed(false)}
                >
                  <PanelLeftOpen className="h-5 w-5" />
                </Button>
              ) : (
                /* Dropped Profile Logic Here for Expanded State, reusing simpler version or full */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 px-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 h-12 py-1"
                    >
                      {/* Show current org or personal profile */}
                      {currentOrg ? (
                        <>
                          <Avatar className="h-8 w-8 rounded-full">
                            {currentOrg.logo ? (
                              <AvatarImage
                                src={currentOrg.logo}
                                alt={currentOrg.name}
                              />
                            ) : (
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {currentOrg.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-normal text-[13px] truncate text-neutral-900 dark:text-neutral-100">
                              {currentOrg.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-normal leading-none mt-0.5">
                              {planDetails.name}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Avatar className="h-8 w-8 rounded-full">
                            {user?.image ? (
                              <AvatarImage
                                src={user.image}
                                alt={user?.name || "User"}
                              />
                            ) : (
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-normal text-[13px] truncate text-neutral-900 dark:text-neutral-100">
                              {user?.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-normal leading-none mt-0.5">
                              {planDetails.name}
                            </div>
                          </div>
                        </>
                      )}
                      <ChevronsUpDown className="h-4 w-4 text-neutral-400 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="start"
                    className="w-[240px] mb-2"
                  >
                    {/* Organization Switcher Section */}
                    <DropdownMenuLabel className="text-xs text-neutral-400 font-normal">
                      アカウントを切り替える
                    </DropdownMenuLabel>

                    {/* Personal Account */}
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer py-2.5"
                      onClick={() => handleSwitchOrg(null)}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-primary-foreground text-[10px] font-medium overflow-hidden">
                        {user?.image ? (
                          <Image
                            src={user.image}
                            alt={user?.name || "User"}
                            width={24}
                            height={24}
                            sizes="24px"
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          user?.name?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-normal text-sm truncate text-neutral-900 dark:text-neutral-100">
                          {user?.name}
                        </span>
                        <span className="text-xs text-neutral-400">
                          個人
                        </span>
                      </div>
                      {!currentOrg && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>

                    {/* Organization List */}
                    {organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        className="gap-2 cursor-pointer py-2.5"
                        onClick={() => handleSwitchOrg(org.id)}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-muted text-muted-foreground text-[10px] font-medium overflow-hidden">
                          {org.logo ? (
                            <Image
                              src={org.logo}
                              alt={org.name}
                              width={24}
                              height={24}
                              sizes="24px"
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            org.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-normal text-sm truncate text-neutral-900 dark:text-neutral-100">
                            {org.name}
                          </span>
                          <span className="text-xs text-neutral-400">
                            チーム
                          </span>
                        </div>
                        {currentOrg?.id === org.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}

                    {/* Create Team Button */}
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer py-2.5"
                      onClick={() => setShowCreateOrgModal(true)}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-muted/50">
                        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm">チームを作成</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Menu Items */}
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer py-2.5"
                      onClick={() => openSettings("account")}
                    >
                      <Building2 className="h-4 w-4" />
                      <span>アカウント</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="gap-2 cursor-pointer py-2.5"
                      onClick={() => setShowSubscriptionModal(true)}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>プランをアップグレード</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="gap-2 cursor-pointer py-2.5"
                      onClick={() => openSettings("settings")}
                    >
                      <Settings className="h-4 w-4" />
                      <span>設定</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="gap-2 cursor-pointer py-2.5"
                      onClick={() => openSettings("help")}
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span>ヘルプ</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="gap-2 cursor-pointer py-2.5"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>ログアウト</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
            {/* Header (Mobile Toggle + Profile) */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0 relative z-20">
              <div className="flex items-center">
                {/* Mobile Menu Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-neutral-500 lg:hidden"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>

                {/* Desktop Expand Toggle when collapsed */}
                {isCollapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hidden lg:flex"
                    onClick={() => setIsCollapsed(false)}
                  >
                    <PanelLeftOpen className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* Profile Icon on the Right */}
              <div className="flex items-center">
                <ProfileAvatarButton />
              </div>
            </div>

            {children}
          </main>
          {isSettingsOpen && (
            <SettingsModal
              open={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
              initialTab={initialTab}
            />
          )}
          {showSubscriptionModal && (
            <SubscriptionModal
              open={showSubscriptionModal}
              onClose={() => setShowSubscriptionModal(false)}
            />
          )}
          <CreateOrgModal
            open={showCreateOrgModal}
            onOpenChange={setShowCreateOrgModal}
          />
        </div>
      </SettingsModalProvider>
    </MastraRuntimeProvider>
  );
}

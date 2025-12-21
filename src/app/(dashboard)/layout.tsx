"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
// import { OrgSwitcher } from "@/components/organization/org-switcher";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { MastraRuntimeProvider } from "@/app/MastraRuntimeProvider";
import { SubscriptionModal } from "@/components/billing/subscription-modal";
import { SettingsModal } from "@/components/profile/settings-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<
    "account" | "settings" | "usage" | "help"
  >("account");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const openSettings = (tab: "account" | "settings" | "usage" | "help") => {
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
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col border-r bg-muted/30 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[60px]" : "w-[260px]"
          )}
        >
          <div className="flex items-center justify-between p-3">
            <div
              className={cn(
                "flex items-center gap-2",
                isCollapsed && "justify-center w-full"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <span className="font-semibold text-sm">ChatGPT-like</span>
              )}
            </div>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setIsCollapsed(true)}
              >
                <PanelLeftClose className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="px-3 space-y-2">
            {/* New Chat */}
            {/* New Chat */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 px-3 transition-colors duration-200",
                "hover:bg-neutral-200/80 dark:hover:bg-neutral-800", // Stronger gray hover
                isCollapsed ? "justify-center px-0" : ""
              )}
              onClick={() => {
                // Logic to start new chat
              }}
            >
              <SquarePen className="h-4 w-4" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">新しいチャット</span>
                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <span className="text-[10px]">⇧</span>
                    <span className="text-[10px]">⌘</span>
                    <span>O</span>
                  </div>
                </>
              )}
            </Button>

            {/* Search */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 px-3 text-muted-foreground transition-colors duration-200",
                "hover:bg-neutral-200/80 dark:hover:bg-neutral-800",
                isCollapsed ? "justify-center px-0" : ""
              )}
            >
              <Search className="h-4 w-4" />
              {!isCollapsed && <span>チャットを検索</span>}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
            {!isCollapsed && (
              <>
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                  今日のチャット
                </div>
                <ThreadList />
              </>
            )}
          </div>

          <div className="border-t p-3">
            {isCollapsed ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-full justify-center"
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
                    className="w-full justify-start gap-3 px-2 hover:bg-accent h-auto py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground text-sm font-medium overflow-hidden">
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
                        user?.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="text-left flex-1 truncate">
                      <div className="font-semibold text-sm truncate">
                        {user?.name}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-[240px] mb-2"
                >
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer py-3"
                    onClick={() => openSettings("account")}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary text-primary-foreground text-[10px] font-medium overflow-hidden">
                      {user?.image ? (
                        <Image
                          src={user.image}
                          alt={user?.name || "User"}
                          width={20}
                          height={20}
                          sizes="20px"
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user?.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user?.name}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="gap-2 cursor-pointer py-3"
                    onClick={() => setShowSubscriptionModal(true)}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>プランをアップグレードする</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="gap-2 cursor-pointer py-3"
                    onClick={() => openSettings("settings")}
                  >
                    <Settings className="h-4 w-4" />
                    <span>設定</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="gap-2 cursor-pointer py-3"
                    onClick={() => openSettings("help")}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>ヘルプ</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="gap-2 cursor-pointer py-3"
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
          {/* If we want the toggle button OUTSIDE when collapsed, we can put it here. But I put a button in the bottom of collapsed sidebar to expand. Or I can put it at top. 
               Let's stick to the sidebar internal toggle for now as per Image 1. 
               Wait, in Image 2 (collapsed), there is NO toggle visible. 
               But I need a way to open it. 
               I'll add a boolean check if I need to render a toggle in main area. 
               For now, the collapsed sidebar has a Button at bottom to open? No, that's weird.
               I'll put the expand button at the top of the collapsed sidebar, replacing the Close button logic? 
               Actually, let's make the Logo clickable or add the toggle button in the header of collapsed sidebar.
           */}
          {isCollapsed && (
            <div className="absolute top-3 left-3 z-50 md:hidden">
              {/* Mobile toggle logic if needed, but we are doing desktop sidebar */}
            </div>
          )}
          {children}
        </main>
        <SettingsModal
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          initialTab={initialTab}
        />
        <SubscriptionModal
          open={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
        />
      </div>
    </MastraRuntimeProvider>
  );
}

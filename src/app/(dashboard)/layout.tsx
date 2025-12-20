"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { OrgSwitcher } from "@/components/organization/org-switcher";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Settings,
  Users,
  CreditCard,
  Building2,
  LogOut,
  Loader2,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

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

  const navItems = [
    { href: "/chat", icon: MessageSquare, label: "チャット" },
    { href: "/settings", icon: Settings, label: "設定" },
    { href: "/settings/organization", icon: Building2, label: "組織" },
    { href: "/settings/members", icon: Users, label: "メンバー" },
    { href: "/settings/billing", icon: CreditCard, label: "課金" },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-muted/30">
        <div className="p-4">
          <h1 className="text-xl font-bold">AI Assistant</h1>
        </div>

        <div className="px-4 pb-4">
          <OrgSwitcher />
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

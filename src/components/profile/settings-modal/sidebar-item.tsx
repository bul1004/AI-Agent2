"use client";

import type { ReactNode } from "react";
import { BarChart3, ChevronRight, HelpCircle, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettingsTabKey } from "@/components/profile/settings-modal/types";

interface SidebarItemProps {
  iconLabel: SettingsTabKey;
  label: string;
  active: boolean;
  onClick: () => void;
  showChevron?: boolean;
  muted?: boolean;
}

const iconMap: Record<SettingsTabKey, ReactNode> = {
  account: <User className="h-[18px] w-[18px]" />,
  settings: <Settings className="h-[18px] w-[18px]" />,
  usage: <BarChart3 className="h-[18px] w-[18px]" />,
  help: <HelpCircle className="h-[18px] w-[18px]" />,
};

export function SidebarItem({
  iconLabel,
  label,
  active,
  onClick,
  showChevron = false,
  muted = false,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3.5 w-full p-3.5 rounded-2xl text-sm font-semibold transition-all duration-200",
        active
          ? "bg-foreground text-background shadow-lg shadow-foreground/5 md:translate-x-1"
          : muted
            ? "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]"
      )}
    >
      <span className={cn("transition-transform duration-200", active && "scale-110")}>
        {iconMap[iconLabel]}
      </span>
      <span>{label}</span>
      {showChevron && (
        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
      )}
      {active && !showChevron && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-background/40" />
      )}
    </button>
  );
}

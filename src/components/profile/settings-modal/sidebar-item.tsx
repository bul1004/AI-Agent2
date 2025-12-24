"use client";

import type { ReactNode } from "react";
import {
  ChevronRight,
  HelpCircle,
  Settings,
  User,
  Calendar,
  Mail,
  HardDrive,
  Monitor,
  Link2,
  Layers,
  Building2,
} from "lucide-react";
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
  organization: <Building2 className="h-[18px] w-[18px]" />,
  recurring: <Calendar className="h-[18px] w-[18px]" />,
  mail: <Mail className="h-[18px] w-[18px]" />,
  data: <HardDrive className="h-[18px] w-[18px]" />,
  browser: <Monitor className="h-[18px] w-[18px]" />,
  connector: <Link2 className="h-[18px] w-[18px]" />,
  integration: <Layers className="h-[18px] w-[18px]" />,
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
        "group flex items-center gap-2 w-full px-1 py-1.5 rounded-[10px] text-sm font-medium transition-all duration-150",
        active
          ? "bg-[#efefef] text-foreground"
          : muted
            ? "text-foreground hover:bg-[#f5f5f5]"
            : "text-foreground hover:bg-[#f5f5f5]",
      )}
    >
      <span className={cn("transition-colors shrink-0 text-foreground")}>
        {iconMap[iconLabel]}
      </span>
      <span className="truncate">{label}</span>
      {showChevron && (
        <ChevronRight className="h-4 w-4 ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
      )}
    </button>
  );
}

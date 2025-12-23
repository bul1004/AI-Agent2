"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileMenuItemProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  showArrow?: boolean;
  variant?: "default" | "destructive";
  "data-testid"?: string;
}

export function ProfileMenuItem({
  icon,
  label,
  onClick,
  showArrow = false,
  variant = "default",
  "data-testid": dataTestId,
}: ProfileMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors",
        variant === "destructive" && "text-destructive hover:bg-destructive/10"
      )}
      data-testid={dataTestId}
    >
      {icon}
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      {showArrow && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

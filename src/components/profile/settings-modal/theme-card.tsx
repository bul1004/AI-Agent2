"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  preview: ReactNode;
}

export function ThemeCard({
  selected,
  onClick,
  label,
  preview,
}: ThemeCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-3 p-3 cursor-pointer rounded-lg border transition-all duration-200",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <div className="w-full aspect-[4/3] rounded-md overflow-hidden pointer-events-none border">
        {preview}
      </div>
      <div className="flex items-center justify-center py-0.5">
        <span
          className={cn(
            "text-xs font-medium",
            selected
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {label}
        </span>
      </div>
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md">
          <Check className="h-3 w-3 stroke-[2.5]" />
        </div>
      )}
    </div>
  );
}

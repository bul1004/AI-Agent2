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
  icon,
  label,
  preview,
}: ThemeCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-3 p-4 pt-2 cursor-pointer rounded-2xl border-2 transition-all duration-300",
        selected
          ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-xl"
          : "border-muted-foreground/10 bg-muted/20 hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        {preview}
      </div>
      <div className="flex items-center gap-2 py-1">
        <span
          className={cn(
            "p-1 rounded-lg transition-colors",
            selected
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "text-sm font-bold",
            selected
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          {label}
        </span>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </div>
      )}
    </div>
  );
}

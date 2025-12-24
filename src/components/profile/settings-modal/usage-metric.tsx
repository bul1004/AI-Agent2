"use client";

import type { ReactNode } from "react";

interface UsageMetricProps {
  label: string;
  value: string;
  used: number;
  total?: number;
  icon: ReactNode;
}

export function UsageMetric({
  label,
  value,
  used,
  total,
  icon,
}: UsageMetricProps) {
  const percentage = total ? (used / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-bold">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-foreground">{value}</span>
      </div>
      {total && (
        <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-0 bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

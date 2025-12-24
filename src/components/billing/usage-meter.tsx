"use client";

import { useSubscription } from "@/hooks/use-subscription";

export function UsageMeter() {
  const { usage, limits, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const getPercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-primary";
  };

  const formatNumber = (num: number) => num.toLocaleString();

  const metrics = [
    {
      label: "トークン使用量",
      used: usage?.tokens_used || 0,
      limit: limits.tokensPerMonth,
    },
    {
      label: "ストレージ",
      used:
        Math.round(((usage?.storage_bytes || 0) / (1024 * 1024 * 1024)) * 100) /
        100, // GB
      limit: limits.storageGb,
      unit: "GB",
    },
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric) => {
        const percentage = getPercentage(metric.used, metric.limit);
        const barColor = getBarColor(percentage);

        return (
          <div key={metric.label} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{metric.label}</span>
              <span className="text-muted-foreground">
                {formatNumber(metric.used)}
                {metric.unit ? ` ${metric.unit}` : ""} /{" "}
                {metric.limit === -1
                  ? "無制限"
                  : `${formatNumber(metric.limit)}${metric.unit ? ` ${metric.unit}` : ""}`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              {metric.limit !== -1 && (
                <div
                  className={`h-full transition-all ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

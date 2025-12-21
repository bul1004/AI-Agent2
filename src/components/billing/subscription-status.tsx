"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { useActiveOrganization } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SubscriptionStatus() {
  const { data: activeOrg } = useActiveOrganization();
  const { subscription, planDetails, isLoading, isActive } = useSubscription();

  const handleManageSubscription = async () => {
    if (!activeOrg?.id) return;

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: activeOrg.id }),
      });

      const { url, error } = await res.json();
      if (error) throw new Error(error);

      window.location.href = url;
    } catch {
      toast.error("エラーが発生しました");
    }
  };

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-lg bg-muted" />;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{planDetails.name}プラン</h3>
          <p className="text-sm text-muted-foreground">
            {planDetails.price === 0
              ? "無料"
              : `¥${planDetails.price.toLocaleString()}/月`}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isActive
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
          }`}
        >
          {isActive ? "有効" : subscription?.status || "無効"}
        </span>
      </div>

      {subscription?.current_period_end && (
        <p className="mt-2 text-sm text-muted-foreground">
          {subscription.cancel_at_period_end
            ? `${formatDate(subscription.current_period_end)}に終了予定`
            : `次回請求日: ${formatDate(subscription.current_period_end)}`}
        </p>
      )}

      {subscription?.plan !== "free" && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={handleManageSubscription}
        >
          サブスクリプションを管理
        </Button>
      )}
    </div>
  );
}

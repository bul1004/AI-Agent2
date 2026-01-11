"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { useActiveOrganization } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SubscriptionStatus() {
  const { data: activeOrg } = useActiveOrganization();
  const { subscription, planDetails, isLoading, isSubscribed } =
    useSubscription();

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
          <h3 className="font-semibold">{planDetails.name}</h3>
          <p className="text-sm text-muted-foreground">
            {planDetails.price === 0
              ? "未契約"
              : `¥${planDetails.price.toLocaleString()}/シート/月`}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isSubscribed
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
          }`}
        >
          {isSubscribed ? "契約中" : "未契約"}
        </span>
      </div>

      {subscription?.currentPeriodEnd && isSubscribed && (
        <p className="mt-2 text-sm text-muted-foreground">
          {subscription.cancelAtPeriodEnd
            ? `${formatDate(subscription.currentPeriodEnd)}に契約終了予定`
            : `次回請求日: ${formatDate(subscription.currentPeriodEnd)}`}
        </p>
      )}

      {isSubscribed && (
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

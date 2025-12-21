"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useActiveOrganization } from "@/lib/auth/client";
import { PLANS, type PlanType } from "@/lib/server/stripe";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";

export function PricingTable() {
  const { data: activeOrg } = useActiveOrganization();
  const { plan: currentPlan, isLoading } = useSubscription();
  const [loading, setLoading] = useState<PlanType | null>(null);

  const handleUpgrade = async (plan: PlanType) => {
    if (plan === "free" || !activeOrg?.id) return;

    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: activeOrg.id, plan }),
      });

      const { url, error } = await res.json();
      if (error) throw new Error(error);

      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("エラーが発生しました");
    } finally {
      setLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {(Object.entries(PLANS) as [PlanType, typeof PLANS[PlanType]][]).map(
        ([key, plan]) => (
          <div
            key={key}
            className={`rounded-lg border p-6 ${
              currentPlan === key ? "border-primary ring-2 ring-primary" : ""
            }`}
          >
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {currentPlan === key && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    現在のプラン
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold">
                ¥{plan.price.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">
                  /月
                </span>
              </p>
            </div>

            <ul className="mb-6 space-y-2 text-sm">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                {plan.limits.messagesPerMonth === -1
                  ? "無制限メッセージ"
                  : `${plan.limits.messagesPerMonth.toLocaleString()}メッセージ/月`}
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                {plan.limits.membersPerOrg === -1
                  ? "無制限メンバー"
                  : `${plan.limits.membersPerOrg}メンバー`}
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                {plan.limits.storageGb}GB ストレージ
              </li>
            </ul>

            {key !== "free" && currentPlan !== key && (
              <Button
                className="w-full"
                onClick={() => handleUpgrade(key)}
                disabled={loading !== null}
              >
                {loading === key ? "処理中..." : "アップグレード"}
              </Button>
            )}
            {key === "free" && currentPlan === "free" && (
              <Button variant="outline" className="w-full" disabled>
                現在のプラン
              </Button>
            )}
            {currentPlan === key && key !== "free" && (
              <Button variant="outline" className="w-full" disabled>
                現在のプラン
              </Button>
            )}
          </div>
        )
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useActiveOrganization } from "@/lib/auth/client";
import { PLANS } from "@/lib/server/stripe";
import { Button } from "@/components/ui/button";
import { Check, Shield } from "lucide-react";
import { toast } from "sonner";

export function PricingTable() {
  const { data: activeOrg } = useActiveOrganization();
  const { isSubscribed, isLoading } = useSubscription();
  const [loading, setLoading] = useState(false);

  const businessPlan = PLANS.business;

  const handleSubscribe = async () => {
    if (!activeOrg?.id) return;

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: activeOrg.id,
          plan: "business",
        }),
      });

      const { url, error } = await res.json();
      if (error) throw new Error(error);

      window.location.href = url;
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md">
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border-2 border-primary p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold">{businessPlan.name}プラン</h3>
          <p className="mt-4 text-4xl font-bold">
            ¥{businessPlan.price.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground">
              /シート/月
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            宅建士1人あたり月額1万円
          </p>
        </div>

        <ul className="mb-8 space-y-3">
          {businessPlan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mb-4 flex items-center justify-center text-sm text-muted-foreground">
          <Shield className="mr-2 h-4 w-4" />
          30日間返金保証
        </div>

        {isSubscribed ? (
          <Button variant="outline" className="w-full" disabled>
            契約中
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? "処理中..." : "今すぐ始める"}
          </Button>
        )}
      </div>
    </div>
  );
}

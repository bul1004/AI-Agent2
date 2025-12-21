"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { parseAsBoolean, useQueryState } from "nuqs";
import { PricingTable } from "@/components/billing/pricing-table";
import { SubscriptionStatus } from "@/components/billing/subscription-status";
import { UsageMeter } from "@/components/billing/usage-meter";

export default function BillingPage() {
  const [success, setSuccess] = useQueryState(
    "success",
    parseAsBoolean.withDefault(false)
  );
  const [canceled, setCanceled] = useQueryState(
    "canceled",
    parseAsBoolean.withDefault(false)
  );

  useEffect(() => {
    if (success) {
      toast.success("サブスクリプションが有効になりました！");
      void setSuccess(null);
    }
    if (canceled) {
      toast.info("チェックアウトがキャンセルされました");
      void setCanceled(null);
    }
  }, [success, canceled, setSuccess, setCanceled]);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">課金・サブスクリプション</h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold">現在のプラン</h2>
          <SubscriptionStatus />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">今月の使用量</h2>
          <div className="max-w-md">
            <UsageMeter />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">プラン比較</h2>
          <PricingTable />
        </section>
      </div>
    </div>
  );
}

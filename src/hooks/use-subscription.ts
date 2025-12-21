"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/db/client";
import { useActiveOrganization } from "@/lib/auth/client";
import type { PlanType, SubscriptionStatus } from "@/types";
import { PLANS, getPlanLimits } from "@/lib/server/stripe";

interface Subscription {
  plan: PlanType;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface Usage {
  messages_count: number;
  tokens_used: number;
  files_uploaded: number;
  storage_bytes: number;
}

export function useSubscription() {
  const { data: activeOrg } = useActiveOrganization();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!activeOrg?.id) {
        setIsLoading(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();

      // Fetch subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end, cancel_at_period_end")
        .eq("organization_id", activeOrg.id)
        .single();

      if (subData) {
        setSubscription(subData as Subscription);
      } else {
        // Default to free plan
        setSubscription({
          plan: "free",
          status: "active",
          current_period_end: null,
          cancel_at_period_end: false,
        });
      }

      // Fetch current month usage
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      const { data: usageData } = await supabase
        .from("usage")
        .select("messages_count, tokens_used, files_uploaded, storage_bytes")
        .eq("organization_id", activeOrg.id)
        .eq("month", currentMonth)
        .single();

      if (usageData) {
        setUsage(usageData as Usage);
      } else {
        setUsage({
          messages_count: 0,
          tokens_used: 0,
          files_uploaded: 0,
          storage_bytes: 0,
        });
      }

      setIsLoading(false);
    }

    fetchData();
  }, [activeOrg?.id]);

  const limits = subscription ? getPlanLimits(subscription.plan) : getPlanLimits("free");
  const plan = subscription?.plan || "free";
  const planDetails = PLANS[plan];

  return {
    subscription,
    usage,
    limits,
    plan,
    planDetails,
    isLoading,
    isActive: subscription?.status === "active" || subscription?.status === "trialing",
  };
}

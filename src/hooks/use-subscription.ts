"use client";

import useSWR from "swr";
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

interface SubscriptionPayload {
  subscription: Subscription;
  usage: Usage;
}

// 未契約状態がデフォルト
const defaultSubscription: Subscription = {
  plan: "none",
  status: "active",
  current_period_end: null,
  cancel_at_period_end: false,
};

const defaultUsage: Usage = {
  messages_count: 0,
  tokens_used: 0,
  files_uploaded: 0,
  storage_bytes: 0,
};

const fetchSubscriptionPayload = async (
  organizationId: string,
  month: string
): Promise<SubscriptionPayload> => {
  const supabase = createSupabaseBrowserClient();

  const [subscriptionResult, usageResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, cancel_at_period_end")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("usage")
      .select("messages_count, tokens_used, files_uploaded, storage_bytes")
      .eq("organization_id", organizationId)
      .eq("month", month)
      .maybeSingle(),
  ]);

  const subscription = subscriptionResult.data
    ? (subscriptionResult.data as Subscription)
    : defaultSubscription;

  const usage = usageResult.data
    ? (usageResult.data as Usage)
    : defaultUsage;

  return { subscription, usage };
};

export function useSubscription() {
  const { data: activeOrg } = useActiveOrganization();
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const shouldFetch = Boolean(activeOrg?.id);

  const { data, isLoading } = useSWR(
    shouldFetch ? ["subscription-usage", activeOrg?.id, currentMonth] : null,
    ([, organizationId, month]) =>
      fetchSubscriptionPayload(String(organizationId), String(month))
  );

  const subscription = data?.subscription ?? defaultSubscription;
  const usage = data?.usage ?? defaultUsage;

  const plan = subscription?.plan || "none";
  const limits = getPlanLimits(plan);
  const planDetails = PLANS[plan];
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";
  // 有料契約中かどうか（businessプランかつアクティブ）
  const isSubscribed = plan === "business" && isActive;

  return {
    subscription,
    usage,
    limits,
    plan,
    planDetails,
    isLoading,
    isActive,
    isSubscribed,
  };
}

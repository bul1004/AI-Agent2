"use client";

import useSWR from "swr";
import {
  useActiveOrganization,
  useListOrganizations,
  authClient,
} from "@/lib/auth/client";
import { useAuth } from "@/hooks/use-auth";
import type { PlanType, SubscriptionStatus, MemberRole } from "@/types";
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

// APIルート経由でサブスクリプション情報を取得
// RLS認証の問題を回避するため、サーバーサイドで認証済みユーザーとして取得
const fetchSubscriptionPayload = async (
  organizationId: string,
  month: string,
): Promise<SubscriptionPayload> => {
  try {
    const res = await fetch(
      `/api/subscription?organizationId=${encodeURIComponent(organizationId)}&month=${encodeURIComponent(month)}`
    );

    if (!res.ok) {
      console.error("Failed to fetch subscription:", res.status);
      return { subscription: defaultSubscription, usage: defaultUsage };
    }

    const data = await res.json();
    return {
      subscription: data.subscription || defaultSubscription,
      usage: data.usage || defaultUsage,
    };
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return { subscription: defaultSubscription, usage: defaultUsage };
  }
};

// 組織内での現在のユーザーの権限を取得
const fetchUserRole = async (
  organizationId: string,
  userId: string,
): Promise<MemberRole | null> => {
  try {
    const result = await authClient.organization.listMembers({
      query: { organizationId },
    });
    const members = result.data?.members ?? [];
    const currentMember = members.find(
      (m) => m.userId === userId || m.user?.id === userId,
    );
    return (currentMember?.role as MemberRole) ?? null;
  } catch {
    return null;
  }
};

export function useSubscription() {
  const { user } = useAuth();
  const { data: activeOrg, isPending: isActiveOrgLoading } =
    useActiveOrganization();
  const { data: organizations, isPending: isOrgsLoading } =
    useListOrganizations();
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

  // 個人モードかどうか（組織が選択されていない）
  const isPersonalMode = !activeOrg;
  // 組織が存在するかどうか
  const hasOrganizations = (organizations?.length ?? 0) > 0;
  // 使用する対象の組織ID（個人モードの場合は最初の組織、なければユーザーID）
  const targetOrgId = activeOrg?.id ?? organizations?.[0]?.id ?? user?.id;
  const shouldFetch = Boolean(targetOrgId);

  // サブスクリプションと使用量を取得
  const { data, isLoading: isSubscriptionLoading } = useSWR(
    shouldFetch ? ["subscription-usage", targetOrgId, currentMonth] : null,
    ([, organizationId, month]) =>
      fetchSubscriptionPayload(String(organizationId), String(month)),
  );

  // 組織内での現在のユーザーの権限を取得（個人モードではownerとして扱う）
  const { data: userRole, isLoading: isRoleLoading } = useSWR(
    activeOrg?.id && user?.id
      ? ["user-org-role", activeOrg.id, user.id]
      : null,
    ([, orgId, userId]) => fetchUserRole(String(orgId), String(userId)),
  );

  const subscription = data?.subscription ?? defaultSubscription;
  const usage = data?.usage ?? defaultUsage;

  const plan = subscription?.plan || "none";
  const limits = getPlanLimits(plan);
  const planDetails = PLANS[plan];
  const isActive =
    subscription?.status === "active" || subscription?.status === "trialing";
  // 有料契約中かどうか（businessプランかつアクティブ）
  const isSubscribed = plan === "business" && isActive;

  // 権限関連
  const currentRole: MemberRole | null = isPersonalMode ? "owner" : userRole ?? null;
  const canManageSubscription =
    currentRole === "owner" || currentRole === "admin";

  return {
    subscription,
    usage,
    limits,
    plan,
    planDetails,
    isLoading:
      isSubscriptionLoading || isActiveOrgLoading || isOrgsLoading || isRoleLoading,
    isActive,
    isSubscribed,
    // 新しい権限関連のプロパティ
    isPersonalMode,
    hasOrganizations,
    targetOrgId,
    currentRole,
    canManageSubscription,
  };
}

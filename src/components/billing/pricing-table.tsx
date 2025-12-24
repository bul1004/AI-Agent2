"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { PLANS } from "@/lib/server/stripe";
import { Button } from "@/components/ui/button";
import { Check, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function PricingTable() {
  const { user } = useAuth();
  const {
    isSubscribed,
    isLoading,
    isPersonalMode,
    targetOrgId,
    canManageSubscription,
  } = useSubscription();
  const [loading, setLoading] = useState(false);

  const businessPlan = PLANS.business;

  // 課金対象のIDを決定
  // - 個人モードの場合: ユーザーID（個人サブスク）
  // - チームモードの場合: 組織ID（組織サブスク）
  const billingTargetId = isPersonalMode ? user?.id : targetOrgId;
  const isReady = !isLoading && !!billingTargetId;
  const isButtonDisabled = loading || !isReady || !canManageSubscription;

  const handleSubscribe = async () => {
    if (!billingTargetId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 個人モードの場合はユーザーIDを、チームモードの場合は組織IDを送信
          organizationId: billingTargetId,
          plan: "business",
          isPersonal: isPersonalMode,
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

  // ボタンのテキストを決定
  const getButtonText = () => {
    if (loading) return "処理中...";
    if (!isReady) return "読み込み中...";
    if (!canManageSubscription) return "管理者に連絡してください";
    if (isPersonalMode) return "個人プランを始める";
    return "チームプランを始める";
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border-2 border-primary p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold">{businessPlan.name}プラン</h3>
          <p className="mt-4 text-4xl font-bold">
            ¥{businessPlan.price.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground">
              {isPersonalMode ? "/月" : "/シート/月"}
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPersonalMode
              ? "個人事業主向けプラン"
              : "宅建士1人あたり月額1万円"}
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

        {/* メンバー権限の場合の注意書き */}
        {!canManageSubscription && !isLoading && (
          <div className="mb-4 flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              サブスクリプションの管理は管理者またはオーナーのみが行えます。
            </span>
          </div>
        )}

        {isSubscribed ? (
          <Button variant="outline" className="w-full" disabled>
            契約中
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubscribe}
            disabled={isButtonDisabled}
            variant={canManageSubscription ? "default" : "secondary"}
          >
            {getButtonText()}
          </Button>
        )}
      </div>
    </div>
  );
}

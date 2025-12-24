"use client";

import { CreditCard, Mail, Monitor, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { SectionHeader } from "@/components/profile/settings-modal/section-header";
import { UsageMetric } from "@/components/profile/settings-modal/usage-metric";

export function UsageTab() {
  const { plan, planDetails } = useSubscription();
  const isPaidPlan = plan !== "none";

  return (
    <div>
      <SectionHeader
        title="使用状況"
        description="プランの制限とクレジット使用量を視覚化します"
      />

      <div className="space-y-8">
        <div className="p-8 rounded-[32px] bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-xl shadow-primary/5">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider">
                <Zap className="h-3 w-3" />
                Current Plan
              </div>
              <h3 className="text-4xl font-black text-foreground">
                {isPaidPlan ? planDetails.name : "Free"}
              </h3>
            </div>
            {!isPaidPlan && (
              <Button className="px-6 py-6 h-auto rounded-2xl font-bold hover:scale-[1.03] transition-transform">
                Upgrade Now
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <UsageMetric
              label="月間メッセージ"
              value={isPaidPlan ? "無制限" : "50"}
              total={isPaidPlan ? undefined : 50}
              used={12}
              icon={<Mail className="h-5 w-5" />}
            />
            <UsageMetric
              label="クレジット残高"
              value="1,267"
              total={2000}
              used={733}
              icon={<CreditCard className="h-5 w-5" />}
            />
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h4 className="font-bold text-foreground">詳細な統計</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors border-2 border-transparent hover:border-muted-foreground/10 cursor-default">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">毎日リフレッシュ</p>
                  <p className="text-xs text-muted-foreground">
                    毎日00:00に自動更新されます
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold">300 / 300</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors border-2 border-transparent hover:border-muted-foreground/10 cursor-default">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">コンピューティング時間</p>
                  <p className="text-xs text-muted-foreground">
                    今月のAI処理合計時間
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold">4.2h / 20h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

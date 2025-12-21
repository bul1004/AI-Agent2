"use client";

import { useState } from "react";
import {
  Sparkles,
  HelpCircle,
  CalendarClock,
  ChevronRight,
} from "lucide-react";
import { SettingsModal } from "@/components/profile/settings-modal";
import { SubscriptionModal } from "@/components/billing/subscription-modal";

interface CreditDisplayProps {
  credits?: number;
  freeCredits?: number;
  dailyCredits?: number;
}

export function CreditDisplay({
  credits = 1267,
  freeCredits = 967,
  dailyCredits = 300,
}: CreditDisplayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Format credits with comma separator
  const formattedCredits = credits.toLocaleString();

  return (
    <>
      <div className="relative" onMouseLeave={() => setIsHovered(false)}>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
          onMouseEnter={() => setIsHovered(true)}
        >
          <Sparkles className="h-4 w-4" />
          <span className="font-semibold text-sm">{formattedCredits}</span>
        </button>

        {isHovered && (
          <div
            className="absolute top-full right-0 z-50 pt-2"
            onMouseEnter={() => setIsHovered(true)}
          >
            <div className="w-[340px] rounded-2xl border bg-background shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
              <div className="p-4 space-y-3">
                {/* Plan Section */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="text-2xl font-semibold">無料</div>
                  <button
                    onClick={() => {
                      setShowSubscriptionModal(true);
                      setIsHovered(false);
                    }}
                    className="px-4 py-1.5 bg-foreground text-background text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
                  >
                    アップグレード
                  </button>
                </div>

                {/* Credit Breakdown */}
                <div className="space-y-3">
                  {/* Total Credits */}
                  <div className="flex items-start gap-3 p-3 rounded-xl">
                    <Sparkles className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">クレジット</span>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="text-lg font-semibold">
                      {credits.toLocaleString()}
                    </div>
                  </div>

                  {/* Free Credits */}
                  <div className="pl-11">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        無料クレジット
                      </span>
                      <span className="font-medium">
                        {freeCredits.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Daily Credits */}
                  <div className="flex items-start gap-3 p-3 rounded-xl">
                    <CalendarClock className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          毎日更新クレジット
                        </span>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        毎日00:00に300へリフレッシュ
                      </div>
                    </div>
                    <div className="text-lg font-semibold">
                      {dailyCredits.toLocaleString()}
                    </div>
                  </div>

                  {/* Usage Link */}
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setIsHovered(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium">使用状況を確認</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        initialTab="usage"
      />
      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </>
  );
}

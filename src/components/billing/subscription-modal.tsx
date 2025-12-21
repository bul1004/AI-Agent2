"use client";

import { PricingTable } from "@/components/billing/pricing-table";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ open, onClose }: SubscriptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen rounded-none p-0">
        <div className="flex flex-col bg-background h-full">
          <div className="flex items-center justify-between p-6 md:p-8">
            <div className="flex items-center gap-2" />
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-20 pt-4">
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-col items-center text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight mb-4 md:text-4xl">
                  プランをアップグレード
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  より高度なAI機能と、チームでのコラボレーションを強化するためのプランをご用意しました。
                </p>
              </div>

              <PricingTable />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

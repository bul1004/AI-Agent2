"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingTable } from "@/components/billing/pricing-table";

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ open, onClose }: SubscriptionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-in fade-in duration-200">
      <div className="flex items-center justify-between p-6 md:p-8">
        <div className="flex items-center gap-2">
          {/* Logo or Title could go here if needed, keeping it clean for now */}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
          <span className="sr-only">閉じる</span>
        </Button>
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
  );
}

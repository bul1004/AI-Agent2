"use client";

import { ExternalLink, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HelpTab() {
  return (
    <div className="h-full flex flex-col justify-center text-center max-w-md mx-auto py-20">
      <div className="w-24 h-24 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
        <HelpCircle className="h-12 w-12" />
      </div>
      <h2 className="text-3xl font-black mb-4">Support Center</h2>
      <p className="text-muted-foreground font-medium mb-10">
        お困りの際は、ガイドを参照するか、サポートチームにお問い合わせください。
      </p>

      <div className="grid gap-3">
        <Button className="w-full py-7 h-auto rounded-2xl font-bold bg-foreground text-background hover:opacity-90 transition-all flex items-center justify-center gap-2">
          ドキュメントを読む
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="w-full py-7 h-auto rounded-2xl font-bold border-2 hover:bg-muted transition-all"
        >
          サポートにお問い合わせ
        </Button>
      </div>

      <p className="mt-12 text-xs text-muted-foreground font-bold tracking-widest uppercase">
        Version 2.4.0 (Stable)
      </p>
    </div>
  );
}

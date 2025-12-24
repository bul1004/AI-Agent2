"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Send, Sparkles, Users } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [inputValue, setInputValue] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Redirect to chat if authenticated
  useEffect(() => {
    if (!isPending && session?.user) {
      router.push("/chat");
    }
  }, [isPending, session, router]);

  // Show nothing while redirecting
  if (!isPending && session?.user) {
    return null;
  }

  const handleInputFocus = () => {
    setShowSignupModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.length > 0) {
      setShowSignupModal(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/50">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI Assistant</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/login")}>
              ログイン
            </Button>
            <Button onClick={() => router.push("/signup")}>無料で始める</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-primary">AI</span>で仕事を加速
          </h1>
          <p className="mb-12 text-lg text-muted-foreground sm:text-xl">
            高度なAIアシスタントで、調査・分析・文章作成を効率化。
            <br className="hidden sm:block" />
            チームで共有できるナレッジベースも構築できます。
          </p>

          {/* Chat-like input */}
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder="AIに何でも聞いてみてください..."
                className="w-full rounded-2xl px-6 py-6 pr-14 text-lg shadow-lg"
              />
              <button
                onClick={() => setShowSignupModal(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              無料で始められます。クレジットカード不要。
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid max-w-5xl gap-8 px-4 sm:grid-cols-3">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">高度なAI</h3>
              <p className="text-sm text-muted-foreground">
                最新のAIモデルを活用して、正確で詳細な回答を提供
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">チームコラボ</h3>
              <p className="text-sm text-muted-foreground">
                組織でナレッジを共有し、チーム全体の生産性を向上
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">ドキュメント連携</h3>
              <p className="text-sm text-muted-foreground">
                PDFやドキュメントをアップロードして、AIが内容を理解
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="max-w-md rounded-2xl p-8">
          <DialogHeader className="text-center">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary" />
            <DialogTitle className="text-2xl font-bold">
              無料アカウントを作成
            </DialogTitle>
            <DialogDescription className="mt-2">
              30秒で登録完了。すぐにAIと会話を始められます。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-6">
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/signup")}
            >
              メールで登録
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => router.push("/login")}
            >
              すでにアカウントをお持ちの方
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            登録することで、利用規約とプライバシーポリシーに同意したことになります。
          </p>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 AI Assistant. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

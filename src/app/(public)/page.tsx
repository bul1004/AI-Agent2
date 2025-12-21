"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";

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
            <Button onClick={() => router.push("/signup")}>
              無料で始める
            </Button>
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
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder="AIに何でも聞いてみてください..."
                className="w-full rounded-2xl border border-input bg-background px-6 py-4 pr-14 text-lg shadow-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">高度なAI</h3>
            <p className="text-sm text-muted-foreground">
              最新のAIモデルを活用して、正確で詳細な回答を提供
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold">チームコラボ</h3>
            <p className="text-sm text-muted-foreground">
              組織でナレッジを共有し、チーム全体の生産性を向上
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold">ドキュメント連携</h3>
            <p className="text-sm text-muted-foreground">
              PDFやドキュメントをアップロードして、AIが内容を理解
            </p>
          </div>
        </div>
      </main>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSignupModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl">
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mb-6 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="text-2xl font-bold">無料アカウントを作成</h2>
              <p className="mt-2 text-muted-foreground">
                30秒で登録完了。すぐにAIと会話を始められます。
              </p>
            </div>

            <div className="space-y-3">
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
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 AI Assistant. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

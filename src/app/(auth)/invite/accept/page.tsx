"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { organization, useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, LogIn } from "lucide-react";

type AcceptStatus = "loading" | "accepting" | "success" | "error" | "login_required";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const { data: session, isPending: isSessionLoading } = useSession();

  const [status, setStatus] = useState<AcceptStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (isSessionLoading) return;

    if (!invitationId) {
      setStatus("error");
      setErrorMessage("招待IDが見つかりません");
      return;
    }

    if (!session?.user) {
      setStatus("login_required");
      return;
    }

    // Accept the invitation
    const acceptInvitation = async () => {
      setStatus("accepting");
      try {
        const result = await organization.acceptInvitation({
          invitationId,
        });

        if (result.error) {
          setStatus("error");
          setErrorMessage(result.error.message || "招待の受け入れに失敗しました");
          return;
        }

        setStatus("success");

        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "招待の受け入れに失敗しました"
        );
      }
    };

    acceptInvitation();
  }, [invitationId, session, isSessionLoading, router]);

  const loginUrl = `/login?returnTo=${encodeURIComponent(`/invite/accept?id=${invitationId}`)}`;

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-lg">
      {status === "loading" || status === "accepting" ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {status === "loading" ? "読み込み中..." : "招待を受け入れています..."}
          </p>
        </div>
      ) : status === "login_required" ? (
        <div className="flex flex-col items-center gap-6 py-4">
          <LogIn className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold">ログインが必要です</h1>
            <p className="text-sm text-muted-foreground">
              招待を受け入れるには、まずログインしてください
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button asChild className="w-full">
              <Link href={loginUrl}>ログイン</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link
                href={`/signup?returnTo=${encodeURIComponent(`/invite/accept?id=${invitationId}`)}`}
              >
                新規登録
              </Link>
            </Button>
          </div>
        </div>
      ) : status === "success" ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold">招待を受け入れました</h1>
            <p className="text-sm text-muted-foreground">
              組織に参加しました
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            ダッシュボードにリダイレクトしています...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4">
          <XCircle className="h-12 w-12 text-destructive" />
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold">エラーが発生しました</h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">ダッシュボードに戻る</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Suspense
        fallback={
          <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-lg">
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          </div>
        }
      >
        <AcceptInvitationContent />
      </Suspense>
    </div>
  );
}

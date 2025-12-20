import { SignupForm } from "@/components/auth/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">アカウント作成</h1>
        <p className="text-muted-foreground">
          無料でアカウントを作成しましょう
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-primary hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}

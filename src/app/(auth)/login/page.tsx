import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">ログイン</h1>
        <p className="text-muted-foreground">
          アカウントにログインして続けましょう
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        アカウントをお持ちでない方は{" "}
        <Link href="/signup" className="text-primary hover:underline">
          新規登録
        </Link>
      </p>
    </div>
  );
}

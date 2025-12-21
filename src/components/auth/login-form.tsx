"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Chrome, Github } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        toast.error(result.error.message || "ログインに失敗しました");
        return;
      }

      toast.success("ログインしました");
      router.push("/chat");
      router.refresh();
    } catch {
      toast.error("ログインに失敗しました");
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      await signIn.social({
        provider,
        callbackURL: "/chat",
      });
    } catch {
      toast.error("ログインに失敗しました");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            メールアドレス
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            required
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            パスワード
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            required
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "ログイン中..." : "ログイン"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">または</span>
        </div>
      </div>

      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin("google")}
          className="w-full"
        >
          <Chrome className="mr-2 h-4 w-4" />
          Googleでログイン
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin("github")}
          className="w-full"
        >
          <Github className="mr-2 h-4 w-4" />
          GitHubでログイン
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const signupSchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(100, "名前は100文字以内で入力してください"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: SignupFormValues) => {
    try {
      const result = await signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (result.error) {
        toast.error(result.error.message || "登録に失敗しました");
        return;
      }

      toast.success("アカウントを作成しました");
      router.push("/chat");
      router.refresh();
    } catch {
      toast.error("登録に失敗しました");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          名前
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="山田 太郎"
          required
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
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
          placeholder="8文字以上"
          required
          minLength={8}
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
        {form.formState.isSubmitting ? "アカウント作成中..." : "アカウント作成"}
      </Button>
    </form>
  );
}

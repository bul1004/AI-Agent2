"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Loader2,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import { SectionHeader } from "@/components/profile/settings-modal/section-header";
import type { SettingsUser } from "@/components/profile/settings-modal/types";

const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "表示名を入力してください")
    .max(100, "表示名は100文字以内で入力してください"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountTabProps {
  user: SettingsUser | null;
}

export function AccountTab({ user }: AccountTabProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.image || null
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  useEffect(() => {
    form.reset({ name: user?.name || "" });
    setImagePreview(user?.image || null);
  }, [user, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target?.result as string);
    reader.readAsDataURL(file);
    setPendingFile(file);
  };

  const handleSave = async (values: AccountFormValues) => {
    try {
      let imageUrl = user?.image;
      if (pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("organizationId", "user-profile");
        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to upload image");
        const data = await res.json();
        imageUrl = data.url;
      }
      await (authClient as unknown as { updateUser: (data: Record<string, unknown>) => Promise<void> }).updateUser({
        name: values.name,
        image: imageUrl,
      });
      toast.success("プロフィールを更新しました");
      router.refresh();
    } catch {
      toast.error("プロフィールの更新に失敗しました");
    }
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      await (authClient as unknown as { forgetPassword: (data: { email: string }) => Promise<void> }).forgetPassword({
        email: user?.email || "",
      });
      toast.success("パスワード再設定用のメールを送信しました");
    } catch {
      toast.error("メールの送信に失敗しました");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="アカウント"
        description="プロフィール画像と個人設定を管理します"
      />

      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-10">
        <div className="flex flex-col items-start gap-8">
          <div className="relative group">
            <div
              className="relative h-28 w-28 overflow-hidden rounded-3xl border-4 border-muted/50 bg-muted cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Profile"
                  width={112}
                  height={112}
                  sizes="112px"
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-[2px]">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="grid gap-6 w-full max-w-md">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-bold text-muted-foreground ml-1"
              >
                メールアドレス
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted/50 border-none font-medium text-muted-foreground px-4 py-6 rounded-2xl h-auto"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="name"
                className="text-sm font-bold text-foreground ml-1"
              >
                表示名
              </Label>
              <Input
                id="name"
                placeholder="あなたの名前"
                className="bg-muted/30 border-2 focus:border-primary border-transparent transition-all px-4 py-6 rounded-2xl h-auto text-base font-medium shadow-sm"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="px-8 py-6 h-auto rounded-2xl text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              変更を保存
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-16 pt-10 border-t border-border/50">
        <div className="flex items-center justify-between gap-4 p-6 rounded-3xl bg-muted/20 border border-muted-foreground/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>セキュリティ</span>
            </div>
            <p className="text-sm text-muted-foreground">
              パスワードを安全に変更・管理できます。
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleResetPassword}
            disabled={resetLoading}
            className="bg-background border-2 hover:bg-muted font-bold px-6 py-6 h-auto rounded-2xl transition-all"
          >
            {resetLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "パスワードを再設定"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

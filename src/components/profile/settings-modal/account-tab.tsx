"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Camera,
  ChevronLeft,
  Copy,
  Info,
  LogOut,
  Sparkles,
  User,
  UserRound,
  X,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import type { SettingsUser } from "@/components/profile/settings-modal/types";

const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "表示名を入力してください")
    .max(100, "表示名は100文字以内で入力してください"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: z.string().min(8, "パスワードは8文字以上で入力してください"),
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

const setPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "パスワードは8文字以上で入力してください"),
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

interface AccountInfo {
  providerId: string;
  accountId: string;
}

type ViewType = "overview" | "edit" | "password";

interface AccountTabProps {
  user: SettingsUser | null;
}

export function AccountTab({ user }: AccountTabProps) {
  const [view, setView] = useState<ViewType>("overview");
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.image || null,
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const hasCredentialAccount = accounts.some(
    (account) => account.providerId === "credential",
  );

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  const changePasswordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const setPasswordForm = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const fetchAccounts = useCallback(async () => {
    try {
      setAccountsLoading(true);
      // Use native fetch to call BetterAuth list-accounts API
      const response = await fetch("/api/auth/list-accounts", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();
      // BetterAuth returns an array of account objects
      if (Array.isArray(data)) {
        setAccounts(data as AccountInfo[]);
      } else {
        setAccounts([]);
      }
    } catch {
      // If fetching fails, assume no credential account
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    form.reset({ name: user?.name || "" });
    setImagePreview(user?.image || null);
  }, [user, form]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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
      await (
        authClient as unknown as {
          updateUser: (data: Record<string, unknown>) => Promise<void>;
        }
      ).updateUser({
        name: values.name,
        image: imageUrl,
      });
      toast.success("プロフィールを更新しました");
      setView("overview");
      router.refresh();
    } catch {
      toast.error("プロフィールの更新に失敗しました");
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast.success("ユーザーIDをコピーしました");
    }
  };

  const handleChangePassword = async (values: ChangePasswordFormValues) => {
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          revokeOtherSessions: false,
        }),
      });
      const data = await response.json();
      if (response.ok && data.user) {
        toast.success("パスワードを変更しました");
        changePasswordForm.reset();
        setView("overview");
      } else {
        // Handle error response
        const errorMessage = data.message || data.error || "";
        if (errorMessage.includes("INVALID_PASSWORD")) {
          toast.error("現在のパスワードが正しくありません");
        } else {
          toast.error("パスワードの変更に失敗しました");
        }
      }
    } catch {
      toast.error("パスワードの変更に失敗しました");
    }
  };

  const handleSetPassword = async (values: SetPasswordFormValues) => {
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: values.newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok && data.status) {
        toast.success(
          "パスワードを設定しました。メールアドレスとパスワードでもログインできるようになりました",
        );
        setPasswordForm.reset();
        setView("overview");
        fetchAccounts(); // Refresh accounts to reflect new credential account
      } else {
        // Handle error response
        const errorMessage = data.message || data.error || "";
        if (errorMessage.includes("already has a password")) {
          toast.error("既にパスワードが設定されています");
        } else {
          toast.error("パスワードの設定に失敗しました");
        }
      }
    } catch {
      toast.error("パスワードの設定に失敗しました");
    }
  };

  if (view === "password") {
    return (
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <div className="flex items-center gap-2 mb-8 -ml-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setView("overview");
              changePasswordForm.reset();
              setPasswordForm.reset();
              setShowCurrentPassword(false);
              setShowNewPassword(false);
              setShowConfirmPassword(false);
            }}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-[17px] font-bold">
            {hasCredentialAccount ? "パスワードを変更" : "パスワードを設定"}
          </h2>
        </div>

        {hasCredentialAccount ? (
          <form
            onSubmit={changePasswordForm.handleSubmit(handleChangePassword)}
            className="space-y-6 max-w-sm"
          >
            <div className="space-y-1.5">
              <Label className="text-[13px] text-muted-foreground font-medium">
                現在のパスワード
              </Label>
              <div className="relative">
                <Input
                  {...changePasswordForm.register("currentPassword")}
                  type={showCurrentPassword ? "text" : "password"}
                  className="bg-[#f2f2f2] border-0 h-10 rounded-xl pr-10 focus-visible:ring-0 focus-visible:bg-[#ededed] transition-colors font-medium"
                  data-testid="current-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground/80"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {changePasswordForm.formState.errors.currentPassword && (
                <p className="text-red-500 text-xs">
                  {changePasswordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] text-muted-foreground font-medium">
                新しいパスワード
              </Label>
              <div className="relative">
                <Input
                  {...changePasswordForm.register("newPassword")}
                  type={showNewPassword ? "text" : "password"}
                  className="bg-[#f2f2f2] border-0 h-10 rounded-xl pr-10 focus-visible:ring-0 focus-visible:bg-[#ededed] transition-colors font-medium"
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground/80"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {changePasswordForm.formState.errors.newPassword && (
                <p className="text-red-500 text-xs">
                  {changePasswordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] text-muted-foreground font-medium">
                新しいパスワード（確認）
              </Label>
              <div className="relative">
                <Input
                  {...changePasswordForm.register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  className="bg-[#f2f2f2] border-0 h-10 rounded-xl pr-10 focus-visible:ring-0 focus-visible:bg-[#ededed] transition-colors font-medium"
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground/80"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {changePasswordForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs">
                  {changePasswordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={changePasswordForm.formState.isSubmitting}
                className="px-8 h-10 rounded-xl bg-black hover:bg-black/90 text-white font-bold"
                data-testid="change-password-submit"
              >
                {changePasswordForm.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "変更"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={setPasswordForm.handleSubmit(handleSetPassword)}
            className="space-y-6 max-w-sm"
          >
            <p className="text-[13px] text-muted-foreground">
              パスワードを設定すると、メールアドレスとパスワードでもログインできるようになります。
            </p>

            <div className="space-y-1.5">
              <Label className="text-[13px] text-muted-foreground font-medium">
                新しいパスワード
              </Label>
              <div className="relative">
                <Input
                  {...setPasswordForm.register("newPassword")}
                  type={showNewPassword ? "text" : "password"}
                  className="bg-[#f2f2f2] border-0 h-10 rounded-xl pr-10 focus-visible:ring-0 focus-visible:bg-[#ededed] transition-colors font-medium"
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground/80"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {setPasswordForm.formState.errors.newPassword && (
                <p className="text-red-500 text-xs">
                  {setPasswordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] text-muted-foreground font-medium">
                新しいパスワード（確認）
              </Label>
              <div className="relative">
                <Input
                  {...setPasswordForm.register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  className="bg-[#f2f2f2] border-0 h-10 rounded-xl pr-10 focus-visible:ring-0 focus-visible:bg-[#ededed] transition-colors font-medium"
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground/80"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {setPasswordForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs">
                  {setPasswordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={setPasswordForm.formState.isSubmitting}
                className="px-8 h-10 rounded-xl bg-black hover:bg-black/90 text-white font-bold"
                data-testid="set-password-submit"
              >
                {setPasswordForm.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "設定"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  if (view === "edit") {
    return (
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <div className="flex items-center gap-2 mb-8 -ml-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("overview")}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-[17px] font-bold">プロフィール</h2>
        </div>

        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-8">
          <div className="flex items-start gap-8">
            <div className="relative group shrink-0">
              <div
                className="relative h-[100px] w-[100px] overflow-hidden rounded-full border bg-muted cursor-pointer transition-all hover:opacity-90"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile"
                    width={100}
                    height={100}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
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

            <div className="flex-1 space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[13px] text-muted-foreground font-medium">
                  名前
                </Label>
                <div className="relative max-w-sm">
                  <Input
                    {...form.register("name")}
                    className="bg-[#f2f2f2] border-0 h-10 rounded-xl pr-10 focus-visible:ring-0 focus-visible:bg-[#ededed] transition-colors font-medium"
                  />
                  {form.watch("name") && (
                    <button
                      type="button"
                      onClick={() => form.setValue("name", "")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground/80"
                    >
                      <X className="h-4 w-4 bg-muted-foreground/20 rounded-full p-0.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] text-muted-foreground font-medium">
                  メール
                </Label>
                <p className="text-[14px] text-foreground/80 font-medium">
                  {user?.email}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] text-muted-foreground font-medium">
                  ユーザー ID
                </Label>
                <div className="flex items-center gap-2">
                  <p className="text-[14px] text-foreground/80 font-medium">
                    {user?.id || "---"}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyId}
                    className="h-6 w-6 text-muted-foreground hover:bg-transparent hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-[15px] font-bold">
                  {hasCredentialAccount
                    ? "パスワードを変更"
                    : "パスワードを設定"}
                </h3>
                <p className="text-[13px] text-muted-foreground">
                  {hasCredentialAccount
                    ? "アカウントのパスワードを変更します。"
                    : "パスワードを設定すると、メールアドレスでもログインできます。"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setView("password")}
                disabled={accountsLoading}
                className="h-9 px-4 rounded-xl text-[13px] font-bold border-border/60 hover:bg-muted/50"
                data-testid="password-settings-button"
              >
                {accountsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : hasCredentialAccount ? (
                  "変更"
                ) : (
                  "設定"
                )}
              </Button>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-[15px] font-bold">アカウントを削除</h3>
                <p className="text-[13px] text-muted-foreground">
                  これにより、アカウントおよびすべてのデータが削除されます。
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="text-red-500 border-red-100 bg-red-50/30 hover:bg-red-50 hover:text-red-600 hover:border-red-200 h-9 px-4 rounded-xl text-[13px] font-bold"
              >
                アカウントを削除
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="px-8 h-10 rounded-xl bg-black hover:bg-black/90 text-white font-bold"
            >
              保存
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
      <h2 className="text-[17px] font-bold mb-8">アカウント</h2>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full overflow-hidden border bg-muted shrink-0">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || ""}
                width={56}
                height={56}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-[17px] leading-tight mb-0.5">
              {user?.name}
            </h3>
            <p className="text-muted-foreground text-[13px] font-medium">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setView("edit")}
            className="h-9 w-9 rounded-xl border-border/60 hover:bg-muted/50"
            data-testid="edit-profile-button"
          >
            <UserRound className="h-[18px] w-[18px] text-foreground/70" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSignOut}
            className="h-9 w-9 rounded-xl border-border/60 hover:bg-muted/50 text-red-400 hover:text-red-500"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </Button>
        </div>
      </div>

      <div className="bg-[#f8f8f8] border border-border/40 rounded-[20px] overflow-hidden p-5">
        <div className="flex items-center justify-between mb-5">
          <span className="font-bold text-[14px]">無料</span>
          <Button className="bg-black text-white hover:bg-black/90 h-[26px] px-3 text-[11px] font-bold rounded-full">
            アップグレード
          </Button>
        </div>

        <div className="space-y-5 pt-5 border-t border-dashed border-border/60">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-foreground/80">
                <Sparkles className="h-4 w-4" />
                <span className="text-[14px] font-bold">クレジット</span>
                <Info className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
              <p className="text-[12px] text-muted-foreground font-medium">
                無料クレジット
              </p>
            </div>
            <div className="text-right">
              <div className="font-bold text-[15px]">967</div>
              <div className="text-[12px] text-muted-foreground font-bold">
                967
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-foreground/80">
                <Calendar className="h-4 w-4" />
                <span className="text-[14px] font-bold">
                  毎日更新クレジット
                </span>
                <Info className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
              <p className="text-[12px] text-muted-foreground font-medium leading-tight">
                毎日00:00に300へリフレッシュ
              </p>
            </div>
            <div className="font-bold text-[15px]">300</div>
          </div>
        </div>
      </div>
    </div>
  );
}

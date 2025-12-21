"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  User,
  Settings,
  BarChart3,
  HelpCircle,
  Camera,
  Loader2,
  Globe,
  Sun,
  Moon,
  Monitor,
  Check,
  ChevronRight,
  Shield,
  CreditCard,
  Zap,
  ExternalLink,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";

type Tab = "account" | "settings" | "usage" | "help";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: Tab;
}

export function SettingsModal({
  open,
  onOpenChange,
  initialTab = "account",
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const { user } = useAuth();

  // Sync activeTab with initialTab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[80vh] min-h-[600px] bg-background rounded-[32px] shadow-2xl overflow-hidden flex animate-in zoom-in-95 fade-in duration-300 border">
        {/* Sidebar */}
        <div className="w-72 border-r flex flex-col bg-muted/20">
          <div className="p-8">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-black italic text-xl">
                  M
                </span>
              </div>
              <span className="font-bold text-2xl tracking-tight text-foreground">
                manus
              </span>
            </div>

            {/* Navigation */}
            <nav className="space-y-1.5">
              <SidebarItem
                icon={<User className="h-[18px] w-[18px]" />}
                label="アカウント"
                active={activeTab === "account"}
                onClick={() => setActiveTab("account")}
              />
              <SidebarItem
                icon={<Settings className="h-[18px] w-[18px]" />}
                label="設定"
                active={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
              />
              <SidebarItem
                icon={<BarChart3 className="h-[18px] w-[18px]" />}
                label="使用状況"
                active={activeTab === "usage"}
                onClick={() => setActiveTab("usage")}
              />
            </nav>
          </div>

          {/* Bottom Sidebar Actions */}
          <div className="mt-auto p-8 space-y-4">
            <div className="h-px bg-border/60" />
            <button
              className={cn(
                "flex items-center gap-3 w-full p-2.5 text-sm font-medium rounded-xl transition-all group",
                activeTab === "help"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              onClick={() => setActiveTab("help")}
            >
              <HelpCircle className="h-[18px] w-[18px]" />
              <span>ヘルプを取得</span>
              <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto relative bg-background/50 backdrop-blur-3xl">
          {/* Close Button */}
          <div className="absolute top-8 right-8 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full h-10 w-10 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Tab Content */}
          <div className="p-12 max-w-3xl mx-auto min-h-full">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {activeTab === "account" && <AccountTab user={user} />}
              {activeTab === "settings" && <SettingsTab />}
              {activeTab === "usage" && <UsageTab />}
              {activeTab === "help" && <HelpTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sidebar Item Component ---
function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3.5 w-full p-3.5 rounded-2xl text-sm font-semibold transition-all duration-200",
        active
          ? "bg-foreground text-background shadow-lg shadow-foreground/5 md:translate-x-1"
          : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]"
      )}
    >
      <span
        className={cn(
          "transition-transform duration-200",
          active && "scale-110"
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-background/40" />
      )}
    </button>
  );
}

// --- Tab Components ---

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground font-medium">{description}</p>
      )}
    </div>
  );
}

function AccountTab({ user }: any) {
  const [name, setName] = useState(user?.name || "");
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.image || null
  );
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setImagePreview(user.image || null);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setPendingFile(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      await (authClient as any).updateUser({ name, image: imageUrl });
      toast.success("プロフィールを更新しました");
      router.refresh();
    } catch (error) {
      toast.error("プロフィールの更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      // BetterAuth typical reset password flow via email
      await (authClient as any).forgetPassword({
        email: user?.email || "",
      });
      toast.success("パスワード再設定用のメールを送信しました");
    } catch (error) {
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

      <form onSubmit={handleSave} className="space-y-10">
        <div className="flex flex-col items-start gap-8">
          {/* Avatar Edit */}
          <div className="relative group">
            <div
              className="relative h-28 w-28 overflow-hidden rounded-3xl border-4 border-muted/50 bg-muted cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="あなたの名前"
                className="bg-muted/30 border-2 focus:border-primary border-transparent transition-all px-4 py-6 rounded-2xl h-auto text-base font-medium shadow-sm"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-6 h-auto rounded-2xl text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
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

function SettingsTab() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("ja");

  return (
    <div>
      <SectionHeader title="設定" description="外観と言語の好みを設定します" />

      <div className="space-y-12">
        {/* Language Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-bold text-lg mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <span>一般</span>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-bold text-muted-foreground ml-1">
              言語
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full sm:w-[280px] bg-muted/30 border-2 border-transparent hover:border-muted-foreground/20 px-4 py-6 rounded-2xl h-auto text-base font-medium transition-all">
                <SelectValue placeholder="言語を選択" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl border-none p-2 translate-y-2">
                <SelectItem value="ja" className="rounded-xl py-3 font-medium">
                  日本語
                </SelectItem>
                <SelectItem value="en" className="rounded-xl py-3 font-medium">
                  English
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Sun className="h-5 w-5 text-primary" />
            <span>外観</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-medium">
            <ThemeCard
              selected={theme === "light"}
              onClick={() => setTheme("light")}
              icon={<Sun className="h-6 w-6" />}
              label="ライト"
              preview={
                <div className="h-full w-full bg-[#f8fafc] border rounded-t-lg mt-2 flex gap-1 p-2">
                  <div className="w-1/4 h-full bg-white border border-gray-100 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full bg-gray-100 rounded" />
                    <div className="h-3 w-2/3 bg-gray-100 rounded" />
                  </div>
                </div>
              }
            />
            <ThemeCard
              selected={theme === "dark"}
              onClick={() => setTheme("dark")}
              icon={<Moon className="h-6 w-6" />}
              label="ダーク"
              preview={
                <div className="h-full w-full bg-[#0f172a] border border-gray-800 rounded-t-lg mt-2 flex gap-1 p-2">
                  <div className="w-1/4 h-full bg-slate-800 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full bg-slate-800 rounded" />
                    <div className="h-3 w-2/3 bg-slate-800 rounded" />
                  </div>
                </div>
              }
            />
            <ThemeCard
              selected={theme === "system"}
              onClick={() => setTheme("system")}
              icon={<Monitor className="h-6 w-6" />}
              label="システムに従う"
              preview={
                <div className="h-full w-full bg-gradient-to-r from-gray-50 to-gray-900 border rounded-t-lg mt-2 relative overflow-hidden flex gap-1 p-2">
                  <div className="w-1/4 h-full bg-white/50 backdrop-blur rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full bg-white/30 rounded" />
                    <div className="h-3 w-2/3 bg-white/30 rounded" />
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* Personalization Section */}
        <div className="space-y-4 pt-10 border-t border-border/50">
          <div className="text-sm font-bold text-muted-foreground tracking-wider uppercase mb-4">
            パーソナライゼーション
          </div>

          <div className="flex items-center justify-between py-2 group cursor-pointer">
            <div className="space-y-1">
              <div className="font-bold text-foreground">
                限定コンテンツを受け取る
              </div>
              <p className="text-sm text-muted-foreground">
                限定オファー、イベント更新情報、優れたケーススタディ、新機能ガイドを入手。
              </p>
            </div>
            <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <span className="pointer-events-none block h-5 w-5 translate-x-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200" />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 group cursor-pointer">
            <div className="space-y-1">
              <div className="font-bold text-foreground truncate max-w-md">
                キューに入っているタスクが処理を開始したらメールで通知してください
              </div>
              <p className="text-sm text-muted-foreground">
                有効にすると、タスクがキューを終了して処理を開始した際にメールでお知らせしますので、進捗状況を簡単に確認できます。この設定はいつでも変更可能です。
              </p>
            </div>
            <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors">
              <span className="pointer-events-none block h-5 w-5 translate-x-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200" />
            </div>
          </div>
        </div>

        {/* Cookie Section */}
        <div className="pt-10 border-t border-border/50">
          <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/20 border border-muted-foreground/10">
            <div className="font-bold text-foreground">クッキーを管理</div>
            <Button
              variant="outline"
              className="bg-background border-2 hover:bg-muted font-bold px-6 py-6 h-auto rounded-2xl transition-all"
            >
              管理
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ selected, onClick, icon, label, preview }: any) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-3 p-4 pt-2 cursor-pointer rounded-2xl border-2 transition-all duration-300",
        selected
          ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-xl"
          : "border-muted-foreground/10 bg-muted/20 hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        {preview}
      </div>
      <div className="flex items-center gap-2 py-1">
        <span
          className={cn(
            "p-1 rounded-lg transition-colors",
            selected
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "text-sm font-bold",
            selected
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          {label}
        </span>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </div>
      )}
    </div>
  );
}

function UsageTab() {
  const { plan, planDetails } = useSubscription();
  const isPaidPlan = plan !== "free";

  return (
    <div>
      <SectionHeader
        title="使用状況"
        description="プランの制限とクレジット使用量を視覚化します"
      />

      <div className="space-y-8">
        {/* Plan Summary Card */}
        <div className="p-8 rounded-[32px] bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-xl shadow-primary/5">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider">
                <Zap className="h-3 w-3" />
                Current Plan
              </div>
              <h3 className="text-4xl font-black text-foreground">
                {isPaidPlan ? planDetails.name : "Free"}
              </h3>
            </div>
            {!isPaidPlan && (
              <Button className="px-6 py-6 h-auto rounded-2xl font-bold hover:scale-[1.03] transition-transform">
                Upgrade Now
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <UsageMetric
              label="月間メッセージ"
              value={isPaidPlan ? "無制限" : "50"}
              total={isPaidPlan ? undefined : 50}
              used={12}
              icon={<Mail className="h-5 w-5" />}
            />
            <UsageMetric
              label="クレジット残高"
              value="1,267"
              total={2000}
              used={733}
              icon={<CreditCard className="h-5 w-5" />}
            />
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="p-6 space-y-4">
          <h4 className="font-bold text-foreground">詳細な統計</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors border-2 border-transparent hover:border-muted-foreground/10 cursor-default">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">毎日リフレッシュ</p>
                  <p className="text-xs text-muted-foreground">
                    毎日00:00に自動更新されます
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold">300 / 300</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors border-2 border-transparent hover:border-muted-foreground/10 cursor-default">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">コンピューティング時間</p>
                  <p className="text-xs text-muted-foreground">
                    今月のAI処理合計時間
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold">4.2h / 20h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageMetric({ label, value, used, total, icon }: any) {
  const percentage = total ? (used / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-bold">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-foreground">{value}</span>
      </div>
      {total && (
        <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-0 bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function HelpTab() {
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

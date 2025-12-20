"use client";

import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">設定</h1>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">プロフィール</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                名前
              </label>
              <p className="mt-1">{user?.name || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                メールアドレス
              </label>
              <p className="mt-1">{user?.email || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

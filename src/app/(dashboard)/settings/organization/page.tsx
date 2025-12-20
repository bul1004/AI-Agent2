"use client";

import { useActiveOrganization } from "@/lib/auth-client";

export default function OrganizationSettingsPage() {
  const { data: activeOrg, isPending } = useActiveOrganization();

  if (isPending) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">組織設定</h1>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">組織情報</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                組織名
              </label>
              <p className="mt-1">{activeOrg?.name || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                スラッグ
              </label>
              <p className="mt-1">{activeOrg?.slug || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                組織ID
              </label>
              <p className="mt-1 font-mono text-sm">{activeOrg?.id || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

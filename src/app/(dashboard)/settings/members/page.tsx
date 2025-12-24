"use client";

import { useActiveOrganization } from "@/lib/auth/client";
import { MemberList } from "@/components/organization/member-list";
import { InviteModal } from "@/components/organization/invite-modal";

export default function MembersPage() {
  const { data: activeOrg, isPending } = useActiveOrganization();

  if (isPending || !activeOrg) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">メンバー</h1>
        <InviteModal organizationId={activeOrg.id} />
      </div>

      <div className="max-w-2xl">
        <MemberList organizationId={activeOrg.id} />
      </div>
    </div>
  );
}

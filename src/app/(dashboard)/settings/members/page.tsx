"use client";

import { useActiveOrganization, useSession } from "@/lib/auth/client";
import { MemberList } from "@/components/organization/member-list";
import { InviteModal } from "@/components/organization/invite-modal";
import { useEffect } from "react";

export default function MembersPage() {
  const { data: activeOrg, isPending } = useActiveOrganization();
  const { data: session } = useSession();

  // #region agent log
  useEffect(() => {
    if (!isPending) {
      fetch('http://127.0.0.1:7243/ingest/4e9d29cf-39a7-42c2-8ee8-7c2521fe874c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'members/page.tsx:useEffect',message:'MembersPage state',data:{activeOrgId:activeOrg?.id,activeOrgName:activeOrg?.name,sessionUserId:session?.user?.id,sessionActiveOrgId:(session?.session as Record<string,unknown>)?.activeOrganizationId,sessionActiveOrgRole:(session?.session as Record<string,unknown>)?.activeOrganizationRole},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C'})}).catch(()=>{});
    }
  }, [isPending, activeOrg, session]);
  // #endregion

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

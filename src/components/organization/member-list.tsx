"use client";

import { organization } from "@/lib/auth/client";
import type { MemberRole } from "@/types";
import { useEffect, useState } from "react";

interface Member {
  id: string;
  role: string;
  user?: {
    name?: string;
    email?: string;
  };
}

interface MemberListProps {
  organizationId: string;
}

export function MemberList({ organizationId }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const result = await organization.listMembers({ 
          query: { organizationId } 
        });
        if (result.data?.members) {
          setMembers(result.data.members as Member[]);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setIsPending(false);
      }
    }
    fetchMembers();
  }, [organizationId]);

  const getRoleLabel = (role: MemberRole) => {
    switch (role) {
      case "owner":
        return "オーナー";
      case "admin":
        return "管理者";
      case "member":
        return "メンバー";
      default:
        return role;
    }
  };

  const getRoleBadgeClass = (role: MemberRole) => {
    switch (role) {
      case "owner":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  if (isPending) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {members?.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {member.user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-medium">{member.user?.name || "Unknown"}</p>
              <p className="text-sm text-muted-foreground">
                {member.user?.email}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClass(
              member.role as MemberRole
            )}`}
          >
            {getRoleLabel(member.role as MemberRole)}
          </span>
        </div>
      ))}
    </div>
  );
}

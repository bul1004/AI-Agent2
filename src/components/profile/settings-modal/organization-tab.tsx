"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR, { mutate } from "swr";
import { organization, useActiveOrganization } from "@/lib/auth/client";
import { useAuth } from "@/hooks/use-auth";
import type { MemberRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { UserPlus, Crown, Shield, User, ChevronDown, Trash2 } from "lucide-react";
import { SectionHeader } from "./section-header";

interface Member {
  id: string;
  role: string;
  userId: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

const inviteSchema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
  role: z.enum(["admin", "member"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const fetchMembers = async (organizationId: string): Promise<Member[]> => {
  const result = await organization.listMembers({
    query: { organizationId },
  });
  return (result.data?.members ?? []) as Member[];
};

export function OrganizationTab() {
  const { data: activeOrg } = useActiveOrganization();
  const { user } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const { data: members = [], isLoading: isLoadingMembers } = useSWR(
    activeOrg?.id ? ["organization-members", activeOrg.id] : null,
    ([, orgId]) => fetchMembers(String(orgId))
  );

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  // Find current user's membership to determine if they can manage members
  const currentUserMember = members.find(
    (m) => m.userId === user?.id || m.user?.id === user?.id
  );
  const currentUserRole = currentUserMember?.role as MemberRole | undefined;
  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";

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

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3.5 w-3.5" />;
      case "admin":
        return <Shield className="h-3.5 w-3.5" />;
      default:
        return <User className="h-3.5 w-3.5" />;
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

  const handleInvite = async (values: InviteFormValues) => {
    if (!activeOrg?.id) return;
    try {
      await organization.inviteMember({
        organizationId: activeOrg.id,
        email: values.email,
        role: values.role,
      });
      toast.success(`${values.email} を招待しました`);
      form.reset({ email: "", role: "member" });
      setIsInviteOpen(false);
    } catch {
      toast.error("招待に失敗しました");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    if (!activeOrg?.id) return;
    setUpdatingMemberId(memberId);
    try {
      await organization.updateMemberRole({
        organizationId: activeOrg.id,
        memberId,
        role: newRole,
      });
      await mutate(["organization-members", activeOrg.id]);
      toast.success("権限を変更しました");
    } catch {
      toast.error("権限の変更に失敗しました");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!activeOrg?.id) return;
    if (!confirm(`${memberName} をチームから削除しますか？`)) return;

    try {
      await organization.removeMember({
        organizationId: activeOrg.id,
        memberIdOrEmail: memberId,
      });
      await mutate(["organization-members", activeOrg.id]);
      toast.success("メンバーを削除しました");
    } catch {
      toast.error("メンバーの削除に失敗しました");
    }
  };

  if (!activeOrg) {
    return null;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="組織"
        description="チームの管理とメンバーの権限を設定します"
      />

      {/* Organization Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">組織情報</h3>
        <div className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">組織名</span>
            <span className="text-sm font-medium">{activeOrg.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">スラッグ</span>
            <span className="text-sm font-mono text-muted-foreground">
              {activeOrg.slug}
            </span>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            メンバー ({members.length})
          </h3>
          {canManageMembers && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsInviteOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              招待
            </Button>
          )}
        </div>

        {isLoadingMembers ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border divide-y">
            {members.map((member) => {
              const memberRole = member.role as MemberRole;
              const isOwner = memberRole === "owner";
              const isSelf = member.userId === user?.id || member.user?.id === user?.id;
              const canChangeRole = canManageMembers && !isOwner && !isSelf;
              const canRemove = canManageMembers && !isOwner && !isSelf;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {member.user?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {member.user?.name || "Unknown"}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (あなた)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canChangeRole ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80 ${getRoleBadgeClass(memberRole)}`}
                            disabled={updatingMemberId === member.id}
                          >
                            {getRoleIcon(memberRole)}
                            {getRoleLabel(memberRole)}
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, "admin")}
                            disabled={memberRole === "admin"}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            管理者
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, "member")}
                            disabled={memberRole === "member"}
                          >
                            <User className="mr-2 h-4 w-4" />
                            メンバー
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(memberRole)}`}
                      >
                        {getRoleIcon(memberRole)}
                        {getRoleLabel(memberRole)}
                      </span>
                    )}

                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          handleRemoveMember(member.id, member.user?.name || "Unknown")
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>チームメンバーを招待</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-sm font-medium">
                メールアドレス
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="member@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role" className="text-sm font-medium">
                権限
              </Label>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger id="invite-role">
                      <SelectValue placeholder="権限を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">メンバー</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "送信中..." : "招待を送信"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

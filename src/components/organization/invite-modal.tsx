"use client";

import { useState } from "react";
import { organization } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, UserPlus } from "lucide-react";

interface InviteModalProps {
  organizationId: string;
}

export function InviteModal({ organizationId }: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await organization.inviteMember({
        organizationId,
        email,
        role,
      });

      toast.success(`${email} を招待しました`);
      setEmail("");
      setOpen(false);
    } catch (error) {
      console.error("Invite error:", error);
      toast.error("招待に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        メンバーを招待
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-4 text-lg font-semibold">チームメンバーを招待</h2>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="invite-email" className="text-sm font-medium">
                  メールアドレス
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.com"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="invite-role" className="text-sm font-medium">
                  権限
                </label>
                <select
                  id="invite-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "member")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="member">メンバー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !email}>
                {loading ? "送信中..." : "招待を送信"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { organization } from "@/lib/auth/client";
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
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface InviteModalProps {
  organizationId: string;
}

const inviteSchema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
  role: z.enum(["admin", "member"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function InviteModal({ organizationId }: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const handleInvite = async (values: InviteFormValues) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4e9d29cf-39a7-42c2-8ee8-7c2521fe874c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'invite-modal.tsx:handleInvite:entry',message:'inviteMember called',data:{organizationId,email:values.email,role:values.role,orgIdType:typeof organizationId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    try {
      const result = await organization.inviteMember({
        organizationId,
        email: values.email,
        role: values.role,
      });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4e9d29cf-39a7-42c2-8ee8-7c2521fe874c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'invite-modal.tsx:handleInvite:success',message:'inviteMember succeeded',data:{result:JSON.stringify(result)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,D'})}).catch(()=>{});
      // #endregion

      toast.success(`${values.email} を招待しました`);
      form.reset({ email: "", role: "member" });
      setOpen(false);
    } catch (error) {
      // #region agent log
      console.log("[DEBUG] inviteMember error:", error);
      console.log("[DEBUG] error type:", typeof error);
      console.log("[DEBUG] error keys:", error ? Object.keys(error as object) : "null");
      console.log("[DEBUG] JSON.stringify:", JSON.stringify(error, null, 2));
      fetch('http://127.0.0.1:7243/ingest/4e9d29cf-39a7-42c2-8ee8-7c2521fe874c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'invite-modal.tsx:handleInvite:error',message:'inviteMember failed',data:{errorMessage:error instanceof Error ? error.message : String(error),errorName:error instanceof Error ? error.name : 'unknown',fullError:JSON.stringify(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      // #endregion
      
      // Parse error to show user-friendly message
      const errorObj = error as { error?: { message?: string; code?: string } };
      const errorCode = errorObj?.error?.code;
      const errorMessage = errorObj?.error?.message;
      
      console.log("[DEBUG] errorCode:", errorCode);
      console.log("[DEBUG] errorMessage:", errorMessage);
      
      if (errorCode === "USER_ALREADY_INVITED" || errorMessage?.includes("already") || errorMessage?.includes("invitation")) {
        toast.error("このメールアドレスは既に招待済みです");
      } else if (errorCode === "USER_IS_ALREADY_A_MEMBER" || errorMessage?.includes("member")) {
        toast.error("このユーザーは既にメンバーです");
      } else {
        toast.error("招待に失敗しました");
      }
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        メンバーを招待
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
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
    </>
  );
}

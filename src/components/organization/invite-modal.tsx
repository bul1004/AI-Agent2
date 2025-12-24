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
    try {
      await organization.inviteMember({
        organizationId,
        email: values.email,
        role: values.role,
      });

      toast.success(`${values.email} を招待しました`);
      form.reset({ email: "", role: "member" });
      setOpen(false);
    } catch (error) {
      // Parse error to show user-friendly message
      const errorObj = error as { error?: { message?: string; code?: string } };
      const errorCode = errorObj?.error?.code;
      const errorMessage = errorObj?.error?.message;

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

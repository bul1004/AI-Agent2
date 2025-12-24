"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Building2, Camera, X } from "lucide-react";

interface CreateOrgModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const createOrgSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "チーム名を入力してください")
    .max(100, "チーム名は100文字以内で入力してください"),
});

type CreateOrgFormValues = z.infer<typeof createOrgSchema>;

export function CreateOrgModal({ open, onOpenChange }: CreateOrgModalProps) {
  const router = useRouter();
  const { createOrg, switchOrg, updateOrg } = useOrganization();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target?.result as string);
    reader.readAsDataURL(file);
    setPendingFile(file);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreate = async (values: CreateOrgFormValues) => {
    try {
      let logoUrl: string | undefined;

      // Upload image if selected
      if (pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("organizationId", "org-logo");
        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to upload image");
        const data = await res.json();
        logoUrl = data.url;
      }

      // Create organization
      const result = await createOrg(values.name);

      if (result.data?.id) {
        // Update organization logo if uploaded
        if (logoUrl) {
          await updateOrg(result.data.id, { logo: logoUrl });
        }

        // Switch to the new organization
        await switchOrg(result.data.id);

        toast.success(`「${values.name}」を作成しました`);

        // Reset form
        form.reset();
        setImagePreview(null);
        setPendingFile(null);
        onOpenChange(false);

        router.refresh();
      }
    } catch {
      toast.error("チームの作成に失敗しました");
    }
  };

  const handleClose = () => {
    form.reset();
    setImagePreview(null);
    setPendingFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新しいチームを作成</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-6">
          {/* Logo Upload */}
          <div className="flex justify-center">
            <div className="relative group">
              <div
                className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted cursor-pointer transition-all hover:border-muted-foreground/50 hover:bg-muted/80"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Team logo"
                    width={96}
                    height={96}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground/50 font-medium">
                      ロゴを追加
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              {imagePreview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearImage();
                  }}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-sm font-medium">
              チーム名
            </Label>
            <Input
              id="org-name"
              placeholder="例: マーケティングチーム"
              {...form.register("name")}
              className="h-10"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "作成中..." : "チームを作成"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

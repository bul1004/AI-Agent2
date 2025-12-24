import { z } from "zod";

// 単一プラン型：businessのみ購入可能
// isPersonal: 個人モードの場合はtrue（organizationIdにはユーザーIDが入る）
export const checkoutRequestSchema = z.object({
  organizationId: z.string().min(1, "organizationId is required"),
  plan: z.literal("business"),
  isPersonal: z.boolean().optional().default(false),
});

export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;

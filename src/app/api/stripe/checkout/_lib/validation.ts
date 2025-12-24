import { z } from "zod";

// 単一プラン型：businessのみ購入可能
export const checkoutRequestSchema = z.object({
  organizationId: z.string().min(1, "organizationId is required"),
  plan: z.literal("business"),
});

export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;

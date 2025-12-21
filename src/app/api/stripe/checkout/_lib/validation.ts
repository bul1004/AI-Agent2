import { z } from "zod";

export const checkoutRequestSchema = z.object({
  organizationId: z.string().min(1, "organizationId is required"),
  plan: z.enum(["free", "pro", "enterprise"]),
});

export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;

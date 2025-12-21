import type { PlanType } from "@/lib/server/stripe";

export interface CheckoutRequestBody {
  organizationId: string;
  plan: PlanType;
}

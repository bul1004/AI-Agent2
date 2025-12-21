import { z } from "zod";

export const portalRequestSchema = z.object({
  organizationId: z.string().min(1, "organizationId is required"),
});

export type PortalRequestInput = z.infer<typeof portalRequestSchema>;

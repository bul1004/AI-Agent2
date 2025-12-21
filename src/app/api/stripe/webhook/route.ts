import { NextRequest } from "next/server";
import { handleStripeWebhook } from "@/app/api/stripe/webhook/_lib/handler";

export async function POST(req: NextRequest) {
  return handleStripeWebhook(req);
}

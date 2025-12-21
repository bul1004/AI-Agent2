import { NextRequest } from "next/server";
import { handleCheckout } from "@/app/api/stripe/checkout/_lib/handler";

export async function POST(req: NextRequest) {
  return handleCheckout(req);
}

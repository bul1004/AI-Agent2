import { NextRequest } from "next/server";
import { handlePortal } from "@/app/api/stripe/portal/_lib/handler";

export async function POST(req: NextRequest) {
  return handlePortal(req);
}

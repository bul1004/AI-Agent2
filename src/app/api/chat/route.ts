import { handleChatRequest } from "@/app/api/chat/_lib/handler";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  return handleChatRequest(req);
}

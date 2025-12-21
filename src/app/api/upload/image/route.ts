import { NextRequest } from "next/server";
import { handleImageUpload } from "@/app/api/upload/image/_lib/handler";

export async function POST(req: NextRequest) {
  return handleImageUpload(req);
}

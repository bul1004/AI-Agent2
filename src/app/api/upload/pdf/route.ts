import { NextRequest } from "next/server";
import { handlePdfUpload } from "@/app/api/upload/pdf/_lib/handler";

export async function POST(req: NextRequest) {
  return handlePdfUpload(req);
}

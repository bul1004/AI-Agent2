import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth/server";
import { uploadToR2, getR2Key } from "@/lib/server/cloudflare/r2";
import { createSupabaseServerClient } from "@/lib/db/server";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { withLog } from "@/lib/server/logging/logwrap";
import { parsePdfUploadFormData } from "@/app/api/upload/pdf/_lib/validation";

const logger = createLogger("api.upload.pdf");

async function handlePdfUploadImpl(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const parsed = parsePdfUploadFormData(formData);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { file, organizationId } = parsed.data;

    const fileId = nanoid();
    const key = getR2Key(organizationId, "pdf", `${fileId}.pdf`);
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToR2(key, buffer, "application/pdf");

    const supabase = await createSupabaseServerClient();
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        organization_id: organizationId,
        title: file.name,
        file_url: url,
        file_type: "pdf",
        created_by: session.user.id,
        metadata: {
          originalName: file.name,
          size: file.size,
          r2Key: key,
        },
      })
      .select()
      .single();

    if (error) throw error;

    logger.info("PDF uploaded", {
      name: "api.upload.pdf",
      userId: session.user.id,
      orgId: organizationId,
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    logger.error("PDF upload error", {
      name: "api.upload.pdf",
      err: serializeError(error),
    });
    return NextResponse.json(
      { error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}

export const handlePdfUpload = withLog(handlePdfUploadImpl, {
  name: "api.upload.pdf",
  pickArgs: ([req]) => ({
    method: req.method,
    urlLen: req.url.length,
  }),
  sampleInfoRate: 0,
});

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth/server";
import { uploadToR2, getR2Key } from "@/lib/server/cloudflare/r2";
import { createSupabaseServerClient } from "@/lib/db/server";
import { createSupabaseAccessToken } from "@/lib/auth/supabase-token";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { withLog } from "@/lib/server/logging/logwrap";
import { parsePdfUploadFormData } from "@/app/api/upload/pdf/_lib/validation";
import { ensurePersonalOrganizationExists } from "@/lib/server/chat/ensure-personal-org";

const logger = createLogger("api.upload.pdf");

async function handlePdfUploadImpl(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let supabaseToken: string | null = null;
    try {
      supabaseToken = await createSupabaseAccessToken(session);
    } catch (error) {
      logger.error("Failed to create Supabase token", {
        name: "api.upload.pdf.token",
        err: serializeError(error),
      });
    }
    if (!supabaseToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const parsed = parsePdfUploadFormData(formData);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { file, organizationId } = parsed.data;

    // 個人モードの場合（organizationId === userId）、個人組織を確保
    if (organizationId === session.user.id) {
      try {
        await ensurePersonalOrganizationExists(organizationId, {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        });
      } catch (orgError) {
        logger.error("Failed to ensure personal organization", {
          name: "api.upload.pdf.org",
          err: serializeError(orgError),
        });
        return NextResponse.json(
          { error: "Failed to create personal organization", details: String(orgError) },
          { status: 500 },
        );
      }
    }

    const fileId = nanoid();
    const key = getR2Key(organizationId, "pdf", `${fileId}.pdf`);
    const buffer = Buffer.from(await file.arrayBuffer());

    let url: string;
    try {
      url = await uploadToR2(key, buffer, "application/pdf");
    } catch (r2Error) {
      logger.error("Failed to upload to R2", {
        name: "api.upload.pdf.r2",
        err: serializeError(r2Error),
      });
      return NextResponse.json(
        { error: "Failed to upload file to storage", details: String(r2Error) },
        { status: 500 },
      );
    }

    const supabase = await createSupabaseServerClient(supabaseToken);
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        id: fileId,
        organizationId: organizationId,
        title: file.name,
        fileUrl: url,
        fileType: "pdf",
        createdBy: session.user.id,
        metadata: {
          originalName: file.name,
          size: file.size,
          r2Key: key,
        },
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to insert document", {
        name: "api.upload.pdf.db",
        err: serializeError(error),
      });
      return NextResponse.json(
        { error: "Failed to save document to database", details: error.message },
        { status: 500 },
      );
    }

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
      { status: 500 },
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

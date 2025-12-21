import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { uploadToCloudflareImages } from "@/lib/server/cloudflare/images";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { withLog } from "@/lib/server/logging/logwrap";
import { parseImageUploadFormData } from "@/app/api/upload/image/_lib/validation";

const logger = createLogger("api.upload.image");

async function handleImageUploadImpl(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const parsed = parseImageUploadFormData(formData);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { file, organizationId } = parsed.data;

    const result = await uploadToCloudflareImages(file, {
      organizationId: organizationId || "",
      userId: session.user.id,
      originalName: file.name,
    });

    logger.info("Image uploaded", {
      name: "api.upload.image",
      userId: session.user.id,
      orgId: organizationId || undefined,
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      url: result.url,
    });
  } catch (error) {
    logger.error("Image upload error", {
      name: "api.upload.image",
      err: serializeError(error),
    });
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

export const handleImageUpload = withLog(handleImageUploadImpl, {
  name: "api.upload.image",
  pickArgs: ([req]) => ({
    method: req.method,
    urlLen: req.url.length,
  }),
  sampleInfoRate: 0,
});

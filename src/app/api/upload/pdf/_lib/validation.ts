export interface PdfUploadPayload {
  file: File;
  organizationId: string;
}

export type PdfUploadParseResult =
  | { ok: true; data: PdfUploadPayload }
  | { ok: false; error: string };

const MAX_PDF_BYTES = 50 * 1024 * 1024;

export function parsePdfUploadFormData(
  formData: FormData,
): PdfUploadParseResult {
  const file = formData.get("file");
  const organizationId = formData.get("organizationId");

  if (!(file instanceof File) || typeof organizationId !== "string") {
    return { ok: false, error: "Missing file or organizationId" };
  }

  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, error: "File too large. Max 50MB" };
  }

  if (file.type && file.type !== "application/pdf") {
    return { ok: false, error: "Only PDF files are allowed" };
  }

  return { ok: true, data: { file, organizationId } };
}

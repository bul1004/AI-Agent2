export interface ImageUploadPayload {
  file: File;
  organizationId: string | null;
}

export type ImageUploadParseResult =
  | { ok: true; data: ImageUploadPayload }
  | { ok: false; error: string };

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function parseImageUploadFormData(formData: FormData): ImageUploadParseResult {
  const file = formData.get("file");
  const organizationId = formData.get("organizationId");

  if (!(file instanceof File)) {
    return { ok: false, error: "Missing file" };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "File too large. Max 10MB" };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Only image files are allowed" };
  }

  return {
    ok: true,
    data: {
      file,
      organizationId: typeof organizationId === "string" ? organizationId : null,
    },
  };
}

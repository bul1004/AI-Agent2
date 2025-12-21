const CLOUDFLARE_API_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`;

export interface CloudflareImageResult {
  id: string;
  url: string;
}

export async function uploadToCloudflareImages(
  file: File,
  metadata?: Record<string, string>
): Promise<CloudflareImageResult> {
  const formData = new FormData();
  formData.append("file", file);

  if (metadata) {
    formData.append("metadata", JSON.stringify(metadata));
  }

  const response = await fetch(CLOUDFLARE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cloudflare Images upload failed: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  const imageId = result.result.id;

  return {
    id: imageId,
    url: `https://imagedelivery.net/${process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH}/${imageId}/public`,
  };
}

export async function deleteFromCloudflareImages(imageId: string): Promise<void> {
  const response = await fetch(`${CLOUDFLARE_API_URL}/${imageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cloudflare Images delete failed: ${JSON.stringify(error)}`);
  }
}

export function getImageUrl(
  imageId: string,
  variant: "public" | "thumbnail" | "avatar" = "public"
): string {
  return `https://imagedelivery.net/${process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH}/${imageId}/${variant}`;
}

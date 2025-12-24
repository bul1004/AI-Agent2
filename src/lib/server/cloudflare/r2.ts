import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { withLog } from "@/lib/server/logging/logwrap";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const getBytes = (file: Buffer | Uint8Array) =>
  file instanceof Buffer ? file.length : file.byteLength;

async function uploadToR2Impl(
  key: string,
  file: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export const uploadToR2 = withLog(uploadToR2Impl, {
  name: "r2.upload",
  pickArgs: ([key, file, contentType]) => ({
    keyLen: key.length,
    bytes: getBytes(file),
    contentType,
  }),
  sampleInfoRate: 1,
});

async function deleteFromR2Impl(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
  );
}

export const deleteFromR2 = withLog(deleteFromR2Impl, {
  name: "r2.delete",
  pickArgs: ([key]) => ({ keyLen: key.length }),
  sampleInfoRate: 1,
});

async function getSignedDownloadUrlImpl(
  key: string,
  expiresIn: number = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

export const getSignedDownloadUrl = withLog(getSignedDownloadUrlImpl, {
  name: "r2.getSignedDownloadUrl",
  pickArgs: ([key, expiresIn]) => ({ keyLen: key.length, expiresIn }),
  sampleInfoRate: 1,
});

async function getSignedUploadUrlImpl(
  key: string,
  contentType: string,
  expiresIn: number = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

export const getSignedUploadUrl = withLog(getSignedUploadUrlImpl, {
  name: "r2.getSignedUploadUrl",
  pickArgs: ([key, contentType, expiresIn]) => ({
    keyLen: key.length,
    contentType,
    expiresIn,
  }),
  sampleInfoRate: 1,
});

export function getR2Key(
  organizationId: string,
  type: "pdf" | "file",
  filename: string,
): string {
  return `${organizationId}/${type}s/${filename}`;
}

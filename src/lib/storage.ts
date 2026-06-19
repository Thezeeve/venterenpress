import { randomUUID } from "crypto";
import { MediaType } from "@prisma/client";
import type { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION ?? "us-east-1";
const bucket = process.env.S3_BUCKET ?? "global-press-network";

let s3ClientPromise: Promise<S3Client> | null = null;

async function getS3Client() {
  if (!s3ClientPromise) {
    s3ClientPromise = import("@aws-sdk/client-s3").then(({ S3Client }) =>
      new S3Client({
        region,
        endpoint: endpoint || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials:
          process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
              }
            : undefined,
      }),
    );
  }

  return s3ClientPromise;
}

export function inferMediaFolder(type: MediaType) {
  switch (type) {
    case MediaType.VIDEO:
      return "videos";
    case MediaType.AUDIO:
    case MediaType.PODCAST_COVER:
      return "audio";
    case MediaType.AUTHOR_PHOTO:
      return "authors";
    default:
      return "images";
  }
}

export function buildObjectKey(type: MediaType, fileName: string) {
  const folder = inferMediaFolder(type);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  return `${folder}/${new Date().getFullYear()}/${randomUUID()}-${safeName}`;
}

export function buildPublicUrl(objectKey: string) {
  if (process.env.S3_PUBLIC_URL_BASE) {
    return `${process.env.S3_PUBLIC_URL_BASE.replace(/\/$/, "")}/${objectKey}`;
  }

  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${bucket}/${objectKey}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;
}

export async function createPresignedUpload(input: {
  fileName: string;
  contentType: string;
  type: MediaType;
}) {
  const [{ PutObjectCommand }, { getSignedUrl }, s3Client] = await Promise.all([
    import("@aws-sdk/client-s3"),
    import("@aws-sdk/s3-request-presigner"),
    getS3Client(),
  ]);
  const objectKey = buildObjectKey(input.type, input.fileName);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: input.contentType,
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return {
    bucket,
    objectKey,
    uploadUrl,
    publicUrl: buildPublicUrl(objectKey),
  };
}

export async function readObjectMetadata(objectKey: string) {
  try {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    const s3Client = await getS3Client();
    const result = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      }),
    );

    return {
      sizeBytes: Number(result.ContentLength ?? 0),
      mimeType: result.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

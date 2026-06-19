import { randomUUID } from "crypto";
import { MediaType } from "@prisma/client";
import type { S3Client } from "@aws-sdk/client-s3";

type StorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  forcePathStyle: boolean;
};

const REQUIRED_STORAGE_ENV_VARS = [
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_PUBLIC_BASE_URL",
] as const;

let s3ClientPromise: Promise<S3Client> | null = null;
let s3ClientCacheKey: string | null = null;

function normalizeUrlBase(value: string) {
  return value.replace(/\/$/, "");
}

function getPublicBaseUrl() {
  return process.env.S3_PUBLIC_BASE_URL ?? process.env.S3_PUBLIC_URL_BASE ?? "";
}

export function getStorageConfig() {
  const config = {
    endpoint: process.env.S3_ENDPOINT?.trim() ?? "",
    region: process.env.S3_REGION?.trim() ?? "",
    bucket: process.env.S3_BUCKET?.trim() ?? "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID?.trim() ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY?.trim() ?? "",
    publicBaseUrl: getPublicBaseUrl().trim(),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  } satisfies StorageConfig;
  const missing = REQUIRED_STORAGE_ENV_VARS.filter((key) => {
    if (key === "S3_PUBLIC_BASE_URL") {
      return !config.publicBaseUrl;
    }

    switch (key) {
      case "S3_ENDPOINT":
        return !config.endpoint;
      case "S3_REGION":
        return !config.region;
      case "S3_BUCKET":
        return !config.bucket;
      case "S3_ACCESS_KEY_ID":
        return !config.accessKeyId;
      case "S3_SECRET_ACCESS_KEY":
        return !config.secretAccessKey;
      default:
        return true;
    }
  });

  if (missing.length > 0) {
    return {
      ok: false as const,
      missing,
      message: `Storage is not configured. Missing env vars: ${missing.join(", ")}.`,
    };
  }

  return {
    ok: true as const,
    config: {
      ...config,
      endpoint: normalizeUrlBase(config.endpoint),
      publicBaseUrl: normalizeUrlBase(config.publicBaseUrl),
    },
  };
}

function requireStorageConfig() {
  const result = getStorageConfig();
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.config;
}

async function getS3Client() {
  const config = requireStorageConfig();
  const cacheKey = JSON.stringify({
    endpoint: config.endpoint,
    region: config.region,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    forcePathStyle: config.forcePathStyle,
  });

  if (!s3ClientPromise || s3ClientCacheKey !== cacheKey) {
    s3ClientCacheKey = cacheKey;
    s3ClientPromise = import("@aws-sdk/client-s3").then(({ S3Client }) =>
      new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: config.forcePathStyle,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
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
  const config = requireStorageConfig();
  return `${config.publicBaseUrl}/${objectKey}`;
}

export async function createPresignedUpload(input: {
  fileName: string;
  contentType: string;
  type: MediaType;
}) {
  const config = requireStorageConfig();
  const [{ PutObjectCommand }, { getSignedUrl }, s3Client] = await Promise.all([
    import("@aws-sdk/client-s3"),
    import("@aws-sdk/s3-request-presigner"),
    getS3Client(),
  ]);
  const objectKey = buildObjectKey(input.type, input.fileName);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    ContentType: input.contentType,
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return {
    bucket: config.bucket,
    objectKey,
    uploadUrl,
    publicUrl: buildPublicUrl(objectKey),
  };
}

export async function getStorageHealth() {
  const result = getStorageConfig();
  if (!result.ok) {
    return {
      status: "error" as const,
      configured: false,
      message: result.message,
      missingEnv: result.missing,
    };
  }

  try {
    const [{ HeadBucketCommand }, s3Client] = await Promise.all([
      import("@aws-sdk/client-s3"),
      getS3Client(),
    ]);

    await s3Client.send(
      new HeadBucketCommand({
        Bucket: result.config.bucket,
      }),
    );

    return {
      status: "ok" as const,
      configured: true,
      bucket: result.config.bucket,
      endpoint: result.config.endpoint,
      publicBaseUrl: result.config.publicBaseUrl,
    };
  } catch (error) {
    return {
      status: "error" as const,
      configured: true,
      message: error instanceof Error ? error.message : "Unable to reach object storage.",
      bucket: result.config.bucket,
      endpoint: result.config.endpoint,
      publicBaseUrl: result.config.publicBaseUrl,
    };
  }
}

export async function readObjectMetadata(objectKey: string) {
  try {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    const s3Client = await getS3Client();
    const config = requireStorageConfig();
    const result = await s3Client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
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

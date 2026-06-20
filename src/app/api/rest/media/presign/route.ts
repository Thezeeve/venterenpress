import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { enqueueMediaProcessing } from "@/lib/jobs/queues";
import { createPresignedUpload } from "@/lib/storage";
import { validateBrowserMutation } from "@/lib/security";
import { mediaUploadRequestSchema } from "@/lib/validation";

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  console.info("Received media presign request", {
    origin: request.headers.get("origin"),
    host: request.headers.get("host"),
  });

  const browserCheck = validateBrowserMutation(request);
  if (!browserCheck.ok) {
    return NextResponse.json({ error: browserCheck.error }, { status: 403 });
  }

  const auth = await requireApiUser("mediaUpload");
  if (!auth.ok) {
    return auth.response;
  }

  const payload = await request.json();
  const parsed = mediaUploadRequestSchema.safeParse(payload);

  if (!parsed.success) {
    console.error("Invalid media presign request payload", {
      issues: parsed.error.flatten(),
    });
    return NextResponse.json({ error: "Invalid media request" }, { status: 400 });
  }

  if (
    parsed.data.type === "IMAGE" &&
    !["image/jpeg", "image/png", "image/webp"].includes(parsed.data.contentType.toLowerCase())
  ) {
    return NextResponse.json({ error: "Upload JPG, JPEG, PNG, or WEBP images only." }, { status: 400 });
  }

  if (parsed.data.type === "IMAGE" && !/\.(jpe?g|png|webp)$/i.test(parsed.data.fileName)) {
    return NextResponse.json({ error: "Upload JPG, JPEG, PNG, or WEBP images only." }, { status: 400 });
  }

  if (parsed.data.type === "IMAGE" && parsed.data.sizeBytes > MAX_IMAGE_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image must be 10MB or smaller." }, { status: 400 });
  }

  let signed;
  try {
    signed = await createPresignedUpload({
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
      type: parsed.data.type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to prepare storage upload.";
    console.error("Media presign generation failed", {
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
      sizeBytes: parsed.data.sizeBytes,
      type: parsed.data.type,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    });
    return NextResponse.json({ error: message }, { status: 503 });
  }

  console.info("Media presign generated", {
    fileName: parsed.data.fileName,
    contentType: parsed.data.contentType,
    sizeBytes: parsed.data.sizeBytes,
    type: parsed.data.type,
    bucket: signed.bucket,
    objectKey: signed.objectKey,
    uploadUrl: signed.uploadUrl,
    publicUrl: signed.publicUrl,
  });

  const media = await prisma.mediaAsset.create({
    data: {
      articleId: parsed.data.articleId || null,
      uploaderId: auth.user.id,
      title: parsed.data.title,
      altText: parsed.data.altText,
      bucket: signed.bucket,
      objectKey: signed.objectKey,
      url: signed.publicUrl,
      type: parsed.data.type,
      mimeType: parsed.data.contentType,
      sizeBytes: 0,
      width: parsed.data.width,
      height: parsed.data.height,
      durationSec: parsed.data.durationSec,
      processingStatus: "PENDING",
      metadata: {
        sourceFileName: parsed.data.fileName,
      },
    },
  });

  await enqueueMediaProcessing(media.id);

  return NextResponse.json({
    data: {
      media,
      upload: signed,
    },
  });
}

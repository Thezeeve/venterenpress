import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { enqueueMediaProcessing } from "@/lib/jobs/queues";
import { createPresignedUpload } from "@/lib/storage";
import { validateBrowserMutation } from "@/lib/security";
import { mediaUploadRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: "Invalid media request" }, { status: 400 });
  }

  if (
    parsed.data.type === "IMAGE" &&
    !["image/jpeg", "image/png", "image/webp"].includes(parsed.data.contentType.toLowerCase())
  ) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  if (parsed.data.type === "IMAGE" && !/\.(jpe?g|png|webp)$/i.test(parsed.data.fileName)) {
    return NextResponse.json({ error: "Unsupported image file extension" }, { status: 400 });
  }

  const signed = await createPresignedUpload({
    fileName: parsed.data.fileName,
    contentType: parsed.data.contentType,
    type: parsed.data.type,
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

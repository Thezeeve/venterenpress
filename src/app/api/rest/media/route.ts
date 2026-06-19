import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";

export async function GET() {
  const auth = await requireApiUser("mediaUpload");
  if (!auth.ok) {
    return auth.response;
  }

  const media = await prisma.mediaAsset.findMany({
    include: {
      article: true,
      uploader: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: media });
}

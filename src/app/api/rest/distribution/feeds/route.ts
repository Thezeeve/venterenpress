import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const feeds = await prisma.syndicationFeed.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: feeds });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const feed = await prisma.syndicationFeed.create({
    data: {
      partnerId: body.partnerId ?? null,
      slug: String(body.slug ?? "").toLowerCase(),
      title: String(body.title ?? ""),
      format: body.format ?? "JSON",
      isPublic: Boolean(body.isPublic),
      regions: body.regions ?? [],
      languages: body.languages ?? [],
    },
  });

  return NextResponse.json({ data: feed }, { status: 201 });
}

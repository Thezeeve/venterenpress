import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const channels = await prisma.videoChannel.findMany({ orderBy: { createdAt: "desc" } });
  const programs = await prisma.videoProgram.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: { channels, programs } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const program = await prisma.videoProgram.create({
    data: {
      channelId: body.channelId ?? null,
      slug: String(body.slug ?? "").toLowerCase(),
      title: String(body.title ?? ""),
      description: body.description ?? null,
      status: body.status ?? "DRAFT",
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
      durationSec: Number(body.durationSec ?? 0),
      liveUrl: body.liveUrl ?? null,
    },
  });

  return NextResponse.json({ data: program }, { status: 201 });
}

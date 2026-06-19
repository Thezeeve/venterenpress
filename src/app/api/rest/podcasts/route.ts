import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const shows = await prisma.podcastShow.findMany({ orderBy: { createdAt: "desc" } });
  const episodes = await prisma.podcastEpisode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: { shows, episodes } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const episode = await prisma.podcastEpisode.create({
    data: {
      showId: body.showId ?? null,
      slug: String(body.slug ?? "").toLowerCase(),
      title: String(body.title ?? ""),
      description: body.description ?? null,
      audioUrl: String(body.audioUrl ?? ""),
      videoUrl: body.videoUrl ?? null,
      durationSec: Number(body.durationSec ?? 0),
      status: body.status ?? "DRAFT",
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
    },
  });

  return NextResponse.json({ data: episode }, { status: 201 });
}

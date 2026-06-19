import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const events = await prisma.crisisEvent.findMany({ orderBy: { updatedAt: "desc" } });
  const updates = await prisma.crisisUpdate.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: { events, updates } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const event = await prisma.crisisEvent.create({
    data: {
      slug: String(body.slug ?? "").toLowerCase(),
      title: String(body.title ?? ""),
      severity: body.severity ?? "WATCH",
      status: body.status ?? "MONITORING",
      description: body.description ?? null,
      startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
    },
  });

  return NextResponse.json({ data: event }, { status: 201 });
}

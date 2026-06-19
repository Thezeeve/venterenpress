import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bureaus = await prisma.bureau.findMany({ orderBy: { createdAt: "desc" } });
  const assignments = await prisma.bureauAssignment.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: { bureaus, assignments } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const bureau = await prisma.bureau.create({
    data: {
      slug: String(body.slug ?? "").toLowerCase(),
      country: String(body.country ?? ""),
      city: String(body.city ?? ""),
      region: body.region ?? "AMERICAS",
      leadEditorId: body.leadEditorId ?? null,
      active: body.active ?? true,
    },
  });

  return NextResponse.json({ data: bureau }, { status: 201 });
}

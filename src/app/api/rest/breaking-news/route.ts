import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { breakingBannerSchema } from "@/lib/validation";

export async function GET() {
  const banners = await prisma.breakingNewsBanner.findMany({
    where: {
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    },
    include: { edition: true },
    orderBy: [{ priority: "desc" }, { startsAt: "desc" }],
  });

  return NextResponse.json({ data: banners });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser("breakingNewsManage");
  if (!auth.ok) {
    return auth.response;
  }

  const payload = await request.json();
  const parsed = breakingBannerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid breaking news banner" }, { status: 400 });
  }

  const banner = await prisma.breakingNewsBanner.create({
    data: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      linkUrl: parsed.data.linkUrl,
      editionId: parsed.data.editionId || null,
      isActive: parsed.data.isActive,
      priority: parsed.data.priority,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : new Date(),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    },
    include: { edition: true },
  });

  return NextResponse.json({ data: banner }, { status: 201 });
}

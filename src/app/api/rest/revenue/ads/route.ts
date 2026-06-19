import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";

export async function GET() {
  const ads = await prisma.adCampaign.findMany({ orderBy: { updatedAt: "desc" } });
  const placements = await prisma.adPlacement.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: { ads, placements } });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser("newsletterManage");
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json();
  const campaign = await prisma.adCampaign.create({
    data: {
      advertiserId: body.advertiserId ?? null,
      title: String(body.title ?? ""),
      status: body.status ?? "DRAFT",
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      budget: body.budget ?? 0,
      impressions: body.impressions ?? 0,
      clicks: body.clicks ?? 0,
    },
  });

  return NextResponse.json({ data: campaign }, { status: 201 });
}

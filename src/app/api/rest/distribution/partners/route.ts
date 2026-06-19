import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";

export async function GET() {
  const partners = await prisma.syndicationPartner.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: partners });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser("newsletterManage");
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json();
  const partner = await prisma.syndicationPartner.create({
    data: {
      slug: String(body.slug ?? "").toLowerCase(),
      name: String(body.name ?? ""),
      website: body.website ?? null,
      status: body.status ?? "DRAFT",
      regions: body.regions ?? [],
      languages: body.languages ?? [],
      apiKeyPrefix: body.apiKeyPrefix ?? null,
    },
  });

  return NextResponse.json({ data: partner }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const listings = await prisma.marketplaceListing.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: listings });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const listing = await prisma.marketplaceListing.create({
    data: {
      slug: String(body.slug ?? "").toLowerCase(),
      title: String(body.title ?? ""),
      type: body.type ?? "SPONSORED_REPORT",
      status: body.status ?? "DRAFT",
      description: body.description ?? null,
      price: body.price ?? 0,
      currency: body.currency ?? "USD",
      authorId: body.authorId ?? null,
      articleId: body.articleId ?? null,
    },
  });

  return NextResponse.json({ data: listing }, { status: 201 });
}

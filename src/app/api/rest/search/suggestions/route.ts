import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ data: [] });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      data: [
        { type: "article", value: "Global chip alliances reshape AI infrastructure competition", href: "/articles/global-chip-alliances-reshape-ai-infrastructure-competition" },
        { type: "category", value: "Technology", href: "/search?category=technology" },
        { type: "tag", value: "AI Infrastructure", href: "/search?q=AI%20Infrastructure" },
      ],
    });
  }

  const [articles, categories, tags] = await Promise.all([
    prisma.article.findMany({
      where: {
        deletedAt: null,
        title: { contains: q, mode: "insensitive" },
      },
      select: { id: true, slug: true, title: true },
      take: 5,
    }).catch(() => []),
    prisma.category.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, slug: true, name: true },
      take: 5,
    }).catch(() => []),
    prisma.tag.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, slug: true, name: true },
      take: 5,
    }).catch(() => []),
  ]);

  return NextResponse.json({
    data: [
      ...articles.map((item) => ({ type: "article", value: item.title, href: `/articles/${item.slug}` })),
      ...categories.map((item) => ({ type: "category", value: item.name, href: `/search?category=${item.slug}` })),
      ...tags.map((item) => ({ type: "tag", value: item.name, href: `/search?q=${encodeURIComponent(item.name)}` })),
    ],
  });
}

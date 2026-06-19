import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  if (query && query.length > 120) {
    return NextResponse.json({ error: "Search query too long" }, { status: 400 });
  }

  const results = await searchArticles({
    query,
    category: searchParams.get("category") ?? undefined,
    authorId: searchParams.get("authorId") ?? undefined,
    editionId: searchParams.get("editionId") ?? undefined,
    articleType: searchParams.get("articleType") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  });

  return NextResponse.json({
    provider: process.env.SEARCH_PROVIDER ?? "POSTGRES",
    data: results,
  });
}

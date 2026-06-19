import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHomepageNewsResponse, getNewsMode } from "@/lib/news-providers";
import { getStorageHealth } from "@/lib/storage";

export const dynamic = "force-dynamic";

function toProviderHealth(status: "idle" | "success" | "error" | "skipped") {
  return status === "error" ? "error" : "ok";
}

export async function GET() {
  const [databaseStatus, homepageNews, storage] = await Promise.all([
    (async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return "connected" as const;
      } catch {
        return "offline" as const;
      }
    })(),
    getHomepageNewsResponse(),
    getStorageHealth(),
  ]);

  return NextResponse.json({
    database: databaseStatus,
    storage,
    newsMode: getNewsMode(),
    lastUpdated: homepageNews.lastUpdated,
    gnews: toProviderHealth(homepageNews.providerStatus.gnews.status),
    newsapi: toProviderHealth(homepageNews.providerStatus.newsapi.status),
  });
}

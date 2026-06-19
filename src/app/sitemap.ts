import { isDatabaseAvailable } from "@/lib/database-availability";
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!await isDatabaseAvailable()) {
    return [
      {
        url: siteConfig.url,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1,
      },
      {
        url: `${siteConfig.url}/search`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      },
      {
        url: `${siteConfig.url}/pricing`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      },
    ];
  }

  const [articles, authors] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
      take: 200,
    }).catch(() => []),
    prisma.user.findMany({
      where: { role: { in: ["JOURNALIST", "EDITOR_IN_CHIEF", "MANAGING_EDITOR"] } },
      select: { id: true, updatedAt: true },
      take: 100,
    }).catch(() => []),
  ]);

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...articles.map((article) => ({
      url: `${siteConfig.url}/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...authors.map((author) => ({
      url: `${siteConfig.url}/authors/${author.id}`,
      lastModified: author.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

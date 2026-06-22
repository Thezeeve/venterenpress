import { isDatabaseAvailable } from "@/lib/database-availability";
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PUBLIC_CATEGORY_CONFIG, PUBLIC_TOPIC_CONFIG } from "@/lib/public-story-feed";
import { resolvePublicTaxonomyHref } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const publicSectionUrls = [
  siteConfig.url,
  `${siteConfig.url}/latest`,
  `${siteConfig.url}/about`,
  `${siteConfig.url}/contact`,
  ...Object.values(PUBLIC_CATEGORY_CONFIG).map((item) => `${siteConfig.url}${item.href}`),
  ...Object.values(PUBLIC_TOPIC_CONFIG).map((item) => `${siteConfig.url}${item.href}`),
];
const publicSectionUrlSet = new Set(publicSectionUrls);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!await isDatabaseAvailable()) {
    return publicSectionUrls.map((url, index) => ({
      url,
      lastModified: new Date(),
      changeFrequency: index === 0 ? "hourly" : "daily",
      priority: index === 0 ? 1 : 0.8,
    }));
  }

  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }).catch(() => []),
    prisma.category.findMany({
      where: {
        articles: {
          some: {
            article: {
              status: "PUBLISHED",
              deletedAt: null,
            },
          },
        },
      },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }).catch(() => []),
  ]);

  const categoryUrls = new Map<string, Date>();
  categories.forEach((category) => {
    const path = resolvePublicTaxonomyHref(category.slug);
    const url = `${siteConfig.url}${path}`;
    if (publicSectionUrlSet.has(url)) {
      return;
    }
    const existing = categoryUrls.get(url);
    if (!existing || existing < category.updatedAt) {
      categoryUrls.set(url, category.updatedAt);
    }
  });

  return [
    ...publicSectionUrls.map((url, index) => ({
      url,
      lastModified: new Date(),
      changeFrequency: index === 0 ? "hourly" as const : "daily" as const,
      priority: index === 0 ? 1 : 0.8,
    })),
    ...[...categoryUrls.entries()].map(([url, lastModified]) => ({
      url,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
    ...articles.map((article) => ({
      url: `${siteConfig.url}/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];
}

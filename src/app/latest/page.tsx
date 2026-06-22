import type { Metadata } from "next";
import { DiscoveryPage } from "@/components/discovery/discovery-page";
import { StructuredDataScript } from "@/components/seo/structured-data-script";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getSeedLatestArticles } from "@/lib/news-providers/seed-content";
import { prisma } from "@/lib/prisma";
import { newsroomArticleInclude } from "@/lib/newsroom";
import { absoluteUrl, buildPageMetadata, buildWebPageStructuredData } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Latest News",
  description: "The latest global reporting, breaking developments, investigations, and fast-moving analysis from VANTERENPRESS.",
  path: "/latest",
});

export default async function LatestPage() {
  const articles = await (async () => {
    if (!await isDatabaseAvailable()) {
      return getSeedLatestArticles();
    }

    try {
      const articles = await prisma.article.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        include: newsroomArticleInclude,
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        take: 18,
      });
      return articles.length ? articles : getSeedLatestArticles();
    } catch {
      return getSeedLatestArticles();
    }
  })();

  return (
    <>
      <StructuredDataScript
        data={buildWebPageStructuredData({
          title: "Latest News",
          description: "The latest global reporting, breaking developments, investigations, and fast-moving analysis from VANTERENPRESS.",
          url: absoluteUrl("/latest"),
          breadcrumbs: [
            { name: "Home", url: absoluteUrl("/") },
            { name: "Latest News", url: absoluteUrl("/latest") },
          ],
        })}
      />
      <DiscoveryPage
        badge="Latest News"
        title="The latest global reporting"
        description="A fast-moving view of breaking stories, live coverage, investigations, and analysis across every edition."
        articles={articles}
        sidebarTitle="Latest priorities"
        sidebarDescription="Jump to the most current sections and audience journeys."
        sidebarLinks={[
          { label: "Breaking news", href: "/search?category=breaking-news" },
          { label: "Live coverage", href: "/live" },
          { label: "Regional editions", href: "/regions" },
          { label: "Most read", href: "/most-read" },
        ]}
      />
    </>
  );
}

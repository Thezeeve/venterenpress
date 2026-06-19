import { DiscoveryPage } from "@/components/discovery/discovery-page";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getSeedMostReadArticles } from "@/lib/news-providers/seed-content";
import { prisma } from "@/lib/prisma";
import { newsroomArticleInclude } from "@/lib/newsroom";

export const dynamic = "force-dynamic";

export default async function MostReadPage() {
  const articles = await (async () => {
    if (!await isDatabaseAvailable()) {
      return getSeedMostReadArticles();
    }

    try {
      const analytics = await prisma.analyticsSnapshot.findMany({
        include: {
          article: {
            include: newsroomArticleInclude,
          },
        },
        orderBy: { views: "desc" },
        take: 18,
      });
      return analytics.length ? analytics.map((snapshot) => snapshot.article) : getSeedMostReadArticles();
    } catch {
      return getSeedMostReadArticles();
    }
  })();

  return (
    <DiscoveryPage
      badge="Most Read"
      title="Stories readers are returning to"
      description="High-traffic stories ranked by reader interest, engagement, and subscription performance."
      articles={articles}
      sidebarTitle="Audience signals"
      sidebarDescription="Use these pages to amplify major reporting and premium journalism."
      sidebarLinks={[
        { label: "Trending search", href: "/search?q=trending" },
        { label: "Premium stories", href: "/pricing" },
        { label: "Opinion", href: "/search?articleType=OPINION" },
        { label: "Most recent", href: "/latest" },
      ]}
    />
  );
}

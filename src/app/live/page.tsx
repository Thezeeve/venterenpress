import Link from "next/link";
import { RadioTower } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getSeedLiveArticles } from "@/lib/news-providers/seed-content";
import { prisma } from "@/lib/prisma";
import { newsroomArticleInclude } from "@/lib/newsroom";

export const dynamic = "force-dynamic";

export default async function LiveIndexPage() {
  const databaseAvailable = await isDatabaseAvailable();
  const [liveArticles, crisisEvents] = await Promise.all([
    (async () => {
      if (!databaseAvailable) {
        return getSeedLiveArticles();
      }

      try {
        const articles = await prisma.article.findMany({
          where: {
            status: "PUBLISHED",
            deletedAt: null,
            articleType: "LIVE_BLOG",
          },
          include: newsroomArticleInclude,
          orderBy: { publishedAt: "desc" },
          take: 12,
        });

        return articles.length ? articles : getSeedLiveArticles();
      } catch {
        return getSeedLiveArticles();
      }
    })(),
    databaseAvailable ? prisma.crisisEvent.findMany({
      orderBy: { startedAt: "desc" },
      take: 6,
    }).catch(() => []) : [],
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Badge>Live coverage</Badge>
        <div className="flex items-center gap-2 text-sm text-[var(--accent)]">
          <RadioTower className="h-4 w-4" />
          Live status active
        </div>
      </div>
      <h1 className="mt-4 font-serif text-5xl">Live newsroom</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">
        Rolling coverage for breaking stories, emergencies, and major events.
      </p>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Live blogs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {liveArticles.length ? liveArticles.map((article) => (
              <Link key={article.id} href={`/live/${article.slug}`} className="block rounded-[24px] border border-[var(--border)] p-5">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                  {article.categories[0]?.category.name ?? article.articleType}
                </div>
                <div className="font-serif text-2xl leading-tight">{article.title}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{article.excerpt}</p>
              </Link>
            )) : (
              <EmptyState title="No live blogs yet" description="Live coverage cards will appear when editorial teams launch event pages." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Crisis events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {crisisEvents.map((event) => (
              <div key={event.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{event.title}</div>
                <div className="mt-1 text-[var(--muted-foreground)]">{event.status} | {event.severity}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

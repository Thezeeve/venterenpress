import { RadioTower } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getSeedStoryBySlug } from "@/lib/news-providers/seed-content";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getSeedLiveArticle(slug: string) {
  const story = getSeedStoryBySlug(slug);
  if (!story?.isLive) {
    return null;
  }

  return {
    id: `seed-live-${story.slug}`,
    title: story.title,
    excerpt: story.summary,
    articleType: "LIVE_BLOG",
    breaking: Boolean(story.isBreaking),
    author: {
      name: story.author.name,
      email: "live@globalpress.network",
    },
    liveUpdates: story.content.map((paragraph, index) => ({
      id: `seed-live-update-${story.slug}-${index}`,
      title: index === 0 ? "Latest line" : `Update ${index + 1}`,
      body: paragraph,
      publishedAt: new Date(new Date(story.publishedAt).getTime() - index * 1000 * 60 * 18),
    })),
    workflowComments: [
      {
        id: `seed-live-note-${story.slug}`,
        body: "Seed fallback active while live provider or CMS coverage is unavailable.",
        user: {
          name: "Live editor",
          email: "live@globalpress.network",
        },
      },
    ],
  };
}

export default async function LiveCoveragePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const databaseAvailable = await isDatabaseAvailable();
  const [article, user] = await Promise.all([
    (async () => {
      if (!databaseAvailable) {
        return getSeedLiveArticle(slug);
      }

      try {
        return (
          await prisma.article.findUnique({
            where: { slug },
            include: {
              author: true,
              liveUpdates: { orderBy: { publishedAt: "desc" } },
              workflowComments: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 4 },
            },
          })
        ) ?? getSeedLiveArticle(slug);
      } catch {
        return getSeedLiveArticle(slug);
      }
    })(),
    getCurrentUser().catch(() => null),
  ]);

  if (!article || article.articleType !== "LIVE_BLOG") {
    notFound();
  }

  const pinned = article.liveUpdates[0] ?? null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Badge>Live Coverage</Badge>
        <div className="flex items-center gap-2 text-sm text-[var(--accent)]">
          <RadioTower className="h-4 w-4" />
          Live status active
        </div>
      </div>
      <h1 className="mt-4 font-serif text-5xl">{article.title}</h1>
      <p className="mt-4 text-lg leading-8 text-[var(--muted-foreground)]">{article.excerpt}</p>
      {pinned ? (
        <Card className="mt-8 border-[var(--accent)]">
          <CardHeader><CardTitle>Pinned update</CardTitle></CardHeader>
          <CardContent>
            <div className="font-semibold">{pinned.title}</div>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{pinned.body}</p>
          </CardContent>
        </Card>
      ) : null}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {article.liveUpdates.map((update) => (
            <Card key={update.id}>
              <CardContent className="p-6">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{update.publishedAt.toLocaleString()}</div>
                <div className="mt-2 font-semibold">{update.title}</div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{update.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Coverage Controls</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
              <div>Author: {article.author.name ?? article.author.email}</div>
              <div>Updates: {article.liveUpdates.length}</div>
              <div>Urgency: {article.breaking ? "Breaking" : "Standard live"}</div>
              {user ? <div>Editor controls available through the protected workflow APIs.</div> : <div>Sign in to manage live coverage.</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Editorial Notes</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
              {article.workflowComments.map((note) => (
                <div key={note.id} className="rounded-2xl bg-[var(--muted)] p-4">
                  <div className="font-medium text-[var(--foreground)]">{note.user.name ?? note.user.email}</div>
                  <div>{note.body}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

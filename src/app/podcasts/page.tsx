import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PodcastsPage() {
  const [shows, episodes] = await Promise.all([
    prisma.podcastShow.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.podcastEpisode.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Podcast Network</Badge>
      <h1 className="mt-4 font-serif text-5xl">Podcast publishing and analytics</h1>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Shows</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {shows.map((show) => (
              <div key={show.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{show.title}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{show.status}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Episodes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {episodes.map((episode) => (
              <div key={episode.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{episode.title}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{episode.status} | {episode.durationSec}s</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DistributionDashboardPage() {
  const [partners, feeds] = await Promise.all([
    prisma.syndicationPartner.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.syndicationFeed.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Global distribution</Badge>
        <h1 className="font-serif text-4xl">Syndication partners, feeds, and licensing</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Partners</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {partners.map((partner) => (
              <div key={partner.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{partner.name}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{partner.status} | {partner.regions.join(", ") || "Global"}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Feeds</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {feeds.map((feed) => (
              <div key={feed.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{feed.title}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{feed.format} | {feed.isPublic ? "Public" : "Private"}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

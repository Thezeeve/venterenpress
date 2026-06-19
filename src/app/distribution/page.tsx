import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DistributionPage() {
  const [partners, feeds] = await Promise.all([
    prisma.syndicationPartner.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.syndicationFeed.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Content Syndication</Badge>
      <h1 className="mt-4 font-serif text-5xl">Partner feeds and licensing</h1>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Partner newsroom feeds</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {partners.map((partner) => (
              <div key={partner.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{partner.name}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{partner.status}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Licensing feeds</CardTitle></CardHeader>
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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewsletterDashboardPage() {
  const [campaigns, subscribers, segments] = await Promise.all([
    prisma.newsletterCampaign.findMany({
      include: {
        segment: true,
        article: true,
        createdBy: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSegment.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Newsletter operations</Badge>
        <h1 className="font-serif text-4xl">Campaigns, segmentation, and article sends</h1>
        <p className="max-w-3xl text-[var(--muted-foreground)]">
          Use newsletter campaigns to package stories by topic and region, then send or schedule through the Redis-backed worker pipeline.
        </p>
      </div>
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Audience overview</CardTitle>
            <CardDescription>Segmented newsletter growth and coverage areas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-2xl bg-[var(--muted)] px-4 py-3">Subscribers | {subscribers}</div>
            {segments.length ? (
              segments.map((segment) => (
                <div key={segment.id} className="rounded-2xl border border-[var(--border)] p-4">
                  <div className="font-medium">{segment.name}</div>
                  <div className="text-[var(--muted-foreground)]">
                    Topics: {segment.topics.join(", ") || "All"} | Regions: {segment.regions.join(", ") || "Global"}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No segments configured" description="Create region and topic segments to power tailored briefings." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Campaign queue</CardTitle>
            <CardDescription>Scheduled and draft campaigns linked to articles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.length ? (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-[24px] border border-[var(--border)] p-5">
                  <div className="font-semibold">{campaign.subject}</div>
                  <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {campaign.segment?.name ?? "All readers"} | {campaign.status} | {campaign.article?.title ?? "Standalone briefing"}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No campaigns yet" description="Create campaigns through the newsletter API and attach stories for sends." />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

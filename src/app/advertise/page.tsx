import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdvertisePage() {
  const [campaigns, placements, analytics] = await (async () => {
    if (!await isDatabaseAvailable()) {
      return [
        [{ id: "campaign-1", title: "Enterprise newsroom launch", status: "ACTIVE", budget: { toString: () => "45000" } }],
        [{ id: "placement-1", name: "Homepage masthead", page: "/", size: "970x250" }],
        { _sum: { views: 34800000, conversions: 3200 }, _avg: { bounceRate: 0.31 } },
      ] as const;
    }

    try {
      return await Promise.all([
        prisma.adCampaign.findMany({ orderBy: { updatedAt: "desc" } }),
        prisma.adPlacement.findMany({ orderBy: { name: "asc" } }),
        prisma.analyticsSnapshot.aggregate({
          _sum: { views: true, conversions: true },
          _avg: { bounceRate: true },
        }),
      ]);
    } catch {
      return [
        [{ id: "campaign-1", title: "Enterprise newsroom launch", status: "ACTIVE", budget: { toString: () => "45000" } }],
        [{ id: "placement-1", name: "Homepage masthead", page: "/", size: "970x250" }],
        { _sum: { views: 34800000, conversions: 3200 }, _avg: { bounceRate: 0.31 } },
      ] as const;
    }
  })();

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Advertising</Badge>
      <h1 className="mt-4 font-serif text-5xl">Media kit and advertiser dashboard</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">
        Audience reach, premium placements, and sponsored content workflows for direct brand partnerships.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link href="/advertise/inquiry">Advertiser inquiry</Link></Button>
        <Button asChild variant="outline"><Link href="/advertise/sponsored-content">Sponsored content</Link></Button>
        <Button asChild variant="outline"><Link href="/advertise/press-release">Press release</Link></Button>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["Audience reach", `${((analytics._sum.views ?? 0) / 1000000).toFixed(1)}M total views`],
          ["Conversions", `${analytics._sum.conversions ?? 0} tracked actions`],
          ["Engagement", `${((analytics._avg.bounceRate ?? 0) * 100).toFixed(1)}% avg. bounce rate`],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{label as string}</div>
              <div className="mt-2 text-2xl font-semibold">{value as string}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Audience statistics</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-[var(--muted-foreground)]">
            <div>Global editorial reach across premium news, live coverage, and newsletters.</div>
            <div>Audience segments can be targeted by edition, topic, region, and access tier.</div>
            <div>Sponsored campaign reporting includes impressions, clicks, and conversions.</div>
            <div className="rounded-2xl bg-[var(--muted)] px-4 py-3">
              Reader profile mix: policy and business readers, premium subscribers, and high-frequency live-news audiences.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sponsored content guidelines</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-[var(--muted-foreground)]">
            <div>All sponsored stories are labeled clearly and reviewed before publication.</div>
            <div>Press releases, reports, and native ads are submitted through dedicated intake flows.</div>
            <div>Editorial independence and disclosure language are mandatory for all partner content.</div>
            <div>Fact-check and legal review can be added for regulated industries, elections, finance, and health campaigns.</div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Ad placement examples</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {placements.map((placement) => (
              <div key={placement.id} className="rounded-2xl bg-[var(--muted)] px-4 py-3">
                <div className="font-medium">{placement.name}</div>
                <div className="text-[var(--muted-foreground)]">{placement.page} | {placement.size}</div>
                <div className="mt-2 h-20 rounded-xl border border-dashed border-[var(--border)] bg-white/60 dark:bg-black/10" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Press release intake</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-[var(--muted-foreground)]">
            <div>Pricing starts with a launch review and scales by audience reach, market, and urgency.</div>
            <div>Submission includes company details, contact details, region targeting, and publication intent.</div>
            <div>Rush intake, compliance review, and multilingual distribution can be quoted as add-ons.</div>
            <Button asChild variant="outline"><Link href="/advertise/press-release">Open intake flow</Link></Button>
          </CardContent>
        </Card>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader><CardTitle>{campaign.title}</CardTitle></CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              <div>{campaign.status}</div>
              <div>Budget ${campaign.budget.toString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

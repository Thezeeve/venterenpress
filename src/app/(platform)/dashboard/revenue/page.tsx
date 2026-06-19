import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RevenueDashboardPage() {
  const [ads, listings, plans] = await Promise.all([
    prisma.adCampaign.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.marketplaceListing.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Revenue platform</Badge>
        <h1 className="font-serif text-4xl">Advertising, enterprise subscriptions, marketplace</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Ad campaigns</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ads.map((ad) => (
              <div key={ad.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{ad.title}</div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  {ad.status} | ${ad.budget.toString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Subscription plans</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{plan.name}</div>
                <div className="text-sm text-[var(--muted-foreground)]">${Number(plan.priceMonthly).toFixed(0)}/mo | {plan.provider}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Marketplace</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {listings.map((listing) => (
              <div key={listing.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{listing.title}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{listing.type} | {listing.status}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

import { Check } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await (async () => {
    if (!await isDatabaseAvailable()) {
      return [
        {
          id: "starter",
          name: "Starter",
          description: "Essential access for readers who need premium briefings and newsletters.",
          priceMonthly: 12,
          features: ["Unlimited premium access", "Regional newsletters", "Bookmarks and reading history"],
        },
        {
          id: "pro",
          name: "Pro",
          description: "Expanded access for professionals following multiple regions and desks.",
          priceMonthly: 24,
          features: ["Everything in Starter", "Breaking alerts", "Subscriber-only analysis"],
        },
        {
          id: "enterprise",
          name: "Enterprise",
          description: "Team access, account management, and custom newsroom briefings.",
          priceMonthly: 79,
          features: ["Multi-seat access", "Priority support", "Custom reporting workflows"],
        },
      ];
    }

    try {
      return await prisma.subscriptionPlan.findMany({
        orderBy: { priceMonthly: "asc" },
      });
    } catch {
      return [
        {
          id: "starter",
          name: "Starter",
          description: "Essential access for readers who need premium briefings and newsletters.",
          priceMonthly: 12,
          features: ["Unlimited premium access", "Regional newsletters", "Bookmarks and reading history"],
        },
        {
          id: "pro",
          name: "Pro",
          description: "Expanded access for professionals following multiple regions and desks.",
          priceMonthly: 24,
          features: ["Everything in Starter", "Breaking alerts", "Subscriber-only analysis"],
        },
        {
          id: "enterprise",
          name: "Enterprise",
          description: "Team access, account management, and custom newsroom briefings.",
          priceMonthly: 79,
          features: ["Multi-seat access", "Priority support", "Custom reporting workflows"],
        },
      ];
    }
  })();

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <Badge>Subscriptions</Badge>
        <h1 className="mt-4 font-serif text-5xl">Support premium global journalism</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--muted-foreground)]">
          Unlock premium investigations, live briefings, newsletter intelligence, and subscriber-only analysis.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          "Unlimited premium access",
          "Regional newsletters and alerts",
          "Reader account with bookmarks, follows, and history",
        ].map((item) => (
          <Card key={item} className="border-dashed">
            <CardContent className="p-5 text-sm">{item}</CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="font-serif text-3xl">{plan.name}</CardTitle>
              <div className="text-sm text-[var(--muted-foreground)]">{plan.description}</div>
              <div className="mt-4 text-4xl font-semibold">${Number(plan.priceMonthly).toFixed(0)}<span className="text-base text-[var(--muted-foreground)]">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-[var(--accent)]" />
                  {feature}
                </div>
              ))}
              <Button asChild className="mt-4 w-full">
                <Link href="/pricing/success">Subscribe</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

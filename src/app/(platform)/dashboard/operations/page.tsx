import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OperationsDashboardPage() {
  const [bureaus, crises, health, plans] = await Promise.all([
    prisma.bureau.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.crisisEvent.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.platformHealthSnapshot.findMany({ orderBy: { capturedAt: "desc" }, take: 6 }),
    prisma.disasterRecoveryPlan.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Global operations</Badge>
        <h1 className="font-serif text-4xl">Bureaus, crisis response, platform health</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bureaus</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {bureaus.map((bureau) => (
              <div key={bureau.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{bureau.city}, {bureau.country}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{bureau.region} | {bureau.active ? "Active" : "Inactive"}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Crisis coverage</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {crises.map((crisis) => (
              <div key={crisis.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{crisis.title}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{crisis.severity} | {crisis.status}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Platform health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {health.map((snapshot) => (
              <div key={snapshot.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{snapshot.region}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{snapshot.status} | latency {snapshot.apiLatencyMs}ms | queue {snapshot.queueDepth}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Disaster recovery</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{plan.name}</div>
                <div className="text-sm text-[var(--muted-foreground)]">RPO {plan.rpoMinutes}m | RTO {plan.rtoMinutes}m</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

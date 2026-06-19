import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { queueNames } from "@/lib/jobs/queues";

export const dynamic = "force-dynamic";

export default async function JobsMonitorPage() {
  const snapshots = await prisma.platformHealthSnapshot.findMany({
    orderBy: { capturedAt: "desc" },
    take: 4,
  });

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Job monitor</Badge>
        <h1 className="font-serif text-4xl">Queue health and worker readiness</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Queues</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {Object.values(queueNames).map((queueName) => (
              <div key={queueName} className="rounded-2xl bg-[var(--muted)] p-4">
                {queueName}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent platform health</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{snapshot.region} | {snapshot.status}</div>
                <div>Latency {snapshot.apiLatencyMs}ms | queue {snapshot.queueDepth}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

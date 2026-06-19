import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const snapshots = await prisma.platformHealthSnapshot.findMany({
    orderBy: { capturedAt: "desc" },
    take: 6,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Status</Badge>
      <h1 className="mt-4 font-serif text-5xl">Platform uptime and service health</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {snapshots.map((snapshot) => (
          <Card key={snapshot.id}>
            <CardHeader><CardTitle>{snapshot.region}</CardTitle></CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              <div>Status: {snapshot.status}</div>
              <div>Latency: {snapshot.apiLatencyMs}ms</div>
              <div>Error rate: {snapshot.errorRate}%</div>
              <div>Queue depth: {snapshot.queueDepth}</div>
              <div>Captured: {snapshot.capturedAt.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

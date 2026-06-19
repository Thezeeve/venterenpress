import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const [channels, programs] = await Promise.all([
    prisma.videoChannel.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.videoProgram.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Global Press TV</Badge>
      <h1 className="mt-4 font-serif text-5xl">Video News Network</h1>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Featured broadcasts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {channels.map((channel) => (
              <div key={channel.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{channel.name}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{channel.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Programs</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {programs.map((program) => (
              <div key={program.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{program.title}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{program.status} | {program.durationSec}s</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

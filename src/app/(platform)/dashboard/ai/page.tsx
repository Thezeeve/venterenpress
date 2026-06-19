import { Badge } from "@/components/ui/badge";
import { AiWorkbench } from "@/components/ai/ai-workbench";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AINewsroomPage() {
  const [researchSessions, insights] = await Promise.all([
    prisma.aIResearchSession.findMany({
      include: { sources: true, findings: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.aIContentInsight.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>AI newsroom</Badge>
        <h1 className="font-serif text-4xl">Research, writing, and content intelligence</h1>
        <p className="max-w-3xl text-[var(--muted-foreground)]">
          AI tooling for source discovery, verification, article optimization, translation, duplication checks, and follow-up recommendations.
        </p>
      </div>
      <AiWorkbench
        researchSessions={researchSessions.map((session) => ({
          id: session.id,
          topic: session.topic,
          status: session.status,
          verificationScore: session.verificationScore,
          contradictionCount: session.contradictionCount,
          notes: session.notes,
        }))}
        insights={insights}
      />
    </main>
  );
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DataDashboardPage() {
  const projects = await prisma.dataProject.findMany({
    include: { visuals: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Data journalism</Badge>
        <h1 className="font-serif text-4xl">Interactive data center</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
              <div>{project.type} | {project.status}</div>
              <div>{project.description}</div>
              <div>{project.visuals.length} visual components</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

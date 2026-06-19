import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ArticleStatusBadge } from "@/components/dashboard/article-status-badge";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JournalistDashboardPage() {
  const user = await getCurrentUser();
  const [articles, assignments, notes] = await Promise.all([
    prisma.article.findMany({
      where: { authorId: user?.id, deletedAt: null },
      include: {
        edition: true,
        categories: { include: { category: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.assignment.findMany({
      where: {
        assigneeId: user?.id,
      },
      include: {
        article: true,
        createdBy: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.researchNote.findMany({
      where: { userId: user?.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Journalist workspace</Badge>
        <h1 className="font-serif text-4xl">Assignments, source tracking, and performance</h1>
        <p className="max-w-3xl text-[var(--muted-foreground)]">
          Connected to live article, assignment, and note data for correspondents, contributors, and investigations desks.
        </p>
      </div>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>My stories</CardTitle>
            <CardDescription>Article creation, revision, and workflow state from Prisma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {articles.length ? (
              articles.map((article) => (
                <div key={article.id} className="rounded-[24px] border border-[var(--border)] p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-2xl">{article.title}</h3>
                      <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {article.edition.name} | {article.categories[0]?.category.name ?? "Uncategorized"}
                      </div>
                    </div>
                    <ArticleStatusBadge status={article.status} />
                  </div>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                    {article.excerpt ?? "No excerpt yet."}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState title="No stories yet" description="Create draft articles through the article API to populate the journalist workspace." />
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {assignments.length ? (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-2xl bg-[var(--muted)] px-4 py-3">
                    <div className="font-medium text-[var(--foreground)]">{assignment.title}</div>
                    <div>{assignment.status} | {assignment.article?.title ?? "Unlinked story"}</div>
                  </div>
                ))
              ) : (
                <EmptyState title="No assignments" description="Assignments from editors and managing desks will appear here." />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Research notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[var(--muted-foreground)]">
              {notes.length ? (
                notes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-[var(--border)] p-4">
                    <div className="font-medium text-[var(--foreground)]">{note.title}</div>
                    <div>{note.body}</div>
                  </div>
                ))
              ) : (
                <EmptyState title="No notes stored" description="Use research note records to persist sourcing, briefing material, and context." />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

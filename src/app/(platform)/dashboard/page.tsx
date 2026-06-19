import Link from "next/link";
import { Activity, CalendarClock, FileCheck2, Globe2, LibraryBig, Mail, Newspaper, Users } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TrafficChart } from "@/components/charts/traffic-chart";
import { ArticleStatusBadge } from "@/components/dashboard/article-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardData } from "@/lib/dashboard-data";
import { getCurrentUser } from "@/lib/server-auth";
import { trafficSeries } from "@/lib/data/mock";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const data = await getDashboardData(user?.id);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge>Executive dashboard</Badge>
          <h1 className="font-serif text-4xl">Global newsroom command center</h1>
          <p className="max-w-3xl text-[var(--muted-foreground)]">
            Cross-edition publishing, audience analytics, editorial workflows, monetization, and newsroom operations in one surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link href="/dashboard/editor">Editor dashboard</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard/media">Media library</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard/newsletters">Newsletters</Link></Button>
          <Button asChild><Link href="/dashboard/journalist">Journalist workspace</Link></Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Traffic and subscriber acceleration</CardTitle>
            <CardDescription>Reach across search, newsletters, mobile, and direct audiences.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficChart data={trafficSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operational overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              [Newspaper, "Stories in production", `${data.ops.articlesInFlight} active`],
              [FileCheck2, "Fact-check queue", `${data.ops.factCheckQueue} pending`],
              [Users, "Active subscribers", `${data.ops.activeSubscriptions}`],
              [CalendarClock, "Scheduled packages", `${data.ops.scheduledStories} queued`],
              [LibraryBig, "Media assets", `${data.ops.mediaCount} available`],
              [Mail, "Newsletter campaigns", `${data.ops.newsletters} campaigns`],
              [Globe2, "Regional editions", "8 live"],
              [Activity, "API health", "99.98% uptime"],
            ].map(([Icon, title, value]) => (
              <div key={title as string} className="flex items-center justify-between rounded-2xl bg-[var(--muted)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[var(--accent)]" />
                  <span>{title as string}</span>
                </div>
                <span className="font-medium">{value as string}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Editorial workload</CardTitle>
            <CardDescription>Assignments and packages moving through the newsroom.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.assignments.length ? (
              data.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-[24px] border border-[var(--border)] p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{assignment.title}</h3>
                    <Badge variant="neutral">{assignment.status}</Badge>
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    {assignment.assignee.name ?? assignment.assignee.email} | {assignment.article?.title ?? "Standalone assignment"}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No assignments yet"
                description="Create assignments through the assignments API or seed data to populate the newsroom workflow."
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent article activity</CardTitle>
            <CardDescription>Live Prisma-backed editorial state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentArticles.length ? (
              data.recentArticles.map((article) => (
                <div key={article.id} className="rounded-[24px] bg-[var(--muted)] p-5">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl">{article.title}</h3>
                      <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {article.edition.name} | {article.categories[0]?.category.name ?? "Uncategorized"}
                      </div>
                    </div>
                    <ArticleStatusBadge status={article.status} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No article activity"
                description="Seed published stories or create new ones through the editor workflow to populate this dashboard."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

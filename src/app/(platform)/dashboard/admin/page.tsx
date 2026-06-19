import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, AlertTriangle, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireDashboardUser("dashboardAccess");
  if (user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const [users, auditLogs, moderationQueue, articleCount] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.article.findMany({
      where: {
        OR: [{ moderationScore: { not: null } }, { status: "FACT_CHECKING" }, { status: "EDITOR_REVIEW" }],
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.article.count({ where: { deletedAt: null } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Super Admin</Badge>
        <h1 className="font-serif text-4xl">Operations, users, moderation, and system health</h1>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link href="/dashboard/admin/settings">Launch settings</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard/operations/jobs">Job monitor</Link></Button>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          [Users, "Users", `${users.length}+ active samples`],
          [Shield, "Audit events", `${auditLogs.length} recent`],
          [AlertTriangle, "Moderation queue", `${moderationQueue.length} items`],
          [Activity, "Articles", `${articleCount} records`],
        ].map(([Icon, label, value]) => (
          <Card key={label as string}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{label as string}</div>
                <div className="mt-2 text-2xl font-semibold">{value as string}</div>
              </div>
              <Icon className="h-5 w-5 text-[var(--accent)]" />
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {users.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{item.name ?? item.email}</div>
                <div className="text-[var(--muted-foreground)]">{item.role} | {item.status}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Content Moderation Queue</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {moderationQueue.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{item.title}</div>
                <div className="text-[var(--muted-foreground)]">{item.status}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Audit Log Viewer</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {auditLogs.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[var(--muted)] p-4">
                <div className="font-medium">{item.action}</div>
                <div className="text-[var(--muted-foreground)]">{item.user.name ?? item.user.email} | {item.resource}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

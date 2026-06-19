import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSettingsClient } from "@/components/admin/admin-settings-client";
import { requireDashboardUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireDashboardUser("dashboardAccess");
  if (user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  const initialSettings = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Admin settings</Badge>
        <h1 className="font-serif text-4xl">Launch controls</h1>
        <p className="max-w-3xl text-[var(--muted-foreground)]">
          Manage identity, homepage composition, breaking news defaults, paywall rules, and ad inventory without touching the codebase.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Launch configuration</CardTitle>
          <CardDescription>These values are persisted in Prisma and drive public launch behavior.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminSettingsClient initialSettings={initialSettings} />
        </CardContent>
      </Card>
    </main>
  );
}

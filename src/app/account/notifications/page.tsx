import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { summarizeNotificationPreferences } from "@/lib/newsroom";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [notifications, profile] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { notificationPreferences: true, newsletterPreferences: true, email: true },
    }),
  ]);
  const preferences = summarizeNotificationPreferences(profile?.notificationPreferences ?? {});

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Notifications</Badge>
      <h1 className="mt-4 font-serif text-5xl">Inbox and editorial alerts</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Breaking alerts", "Configure urgent story notifications and edition-specific alert channels."],
          ["Newsletter delivery", "Choose the topics, regions, and cadence you want in your inbox."],
          ["Push roadmap", "Mobile push notification architecture is staged for future app delivery."],
        ].map(([title, description]) => (
          <Card key={title as string}>
            <CardHeader><CardTitle>{title as string}</CardTitle></CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">{description as string}</CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-8">
        <CardHeader><CardTitle>Recent notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {notifications.length ? notifications.map((notification) => (
            <div key={notification.id} className="rounded-[24px] border border-[var(--border)] p-5">
              <div className="font-medium">{notification.title}</div>
              <div className="mt-1 text-sm text-[var(--muted-foreground)]">{notification.body}</div>
            </div>
          )) : <EmptyState title="No notifications" description="Comment replies, breaking alerts, approvals, and account notices will show up here." />}
        </CardContent>
      </Card>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Preference center</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-[var(--muted-foreground)]">
            <div>Email: {profile?.email}</div>
            <div>Breaking news alerts: {preferences.breakingNews ? "Enabled" : "Muted"}</div>
            <div>In-app comments and reply alerts: {preferences.comments ? "Enabled" : "Muted"}</div>
            <div>Push architecture placeholder: {preferences.push ? "Opted in for future clients" : "Available when mobile/web push ships"}</div>
            <pre className="overflow-auto rounded-2xl bg-[var(--muted)] p-4 text-xs">{JSON.stringify(profile?.notificationPreferences ?? {}, null, 2)}</pre>
            <Button asChild variant="outline">
              <Link href="/account/settings">Manage notification settings</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notification architecture</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-[var(--muted-foreground)]">
            <div>In-app notifications are persisted in PostgreSQL and can be pushed into Redis-backed workers for email or mobile delivery later.</div>
            <div>Breaking alerts, approval events, comments, and subscriptions all share the same notification model.</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

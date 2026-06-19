import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { summarizeNewsletterPreferences } from "@/lib/newsroom";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewsletterPreferencesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { newsletterPreferences: true, email: true },
  });
  const summary = summarizeNewsletterPreferences(profile?.newsletterPreferences ?? {});

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Newsletter center</Badge>
      <h1 className="mt-4 font-serif text-5xl">Briefing preferences</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Breaking alerts", "Receive urgent newsroom notifications by email."],
          ["Regional editions", "Choose the markets and bureaus you want to follow."],
          ["Topic digests", "Pick business, politics, AI, sports, or opinion briefings."],
        ].map(([title, description]) => (
          <Card key={title as string}>
            <CardHeader><CardTitle>{title as string}</CardTitle></CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">{description as string}</CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-8">
        <CardHeader><CardTitle>Current preferences</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>Email: {profile?.email}</div>
          <div>Newsletter preference center is backed by the reader profile and can sync topic-based campaigns.</div>
          <div>Cadence: {summary.cadence}</div>
          <div>Topics: {summary.topics.length ? summary.topics.join(", ") : "Not selected yet"}</div>
          <div>Regions: {summary.regions.length ? summary.regions.join(", ") : "Global coverage"}</div>
          <pre className="overflow-auto rounded-2xl bg-[var(--muted)] p-4 text-xs">{JSON.stringify(profile?.newsletterPreferences ?? {}, null, 2)}</pre>
          <Button asChild variant="outline">
            <Link href="/account/settings">Update subscriptions</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

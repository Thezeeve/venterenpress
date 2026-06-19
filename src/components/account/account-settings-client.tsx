"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { summarizeNewsletterPreferences, summarizeNotificationPreferences } from "@/lib/newsroom";

export function AccountSettingsClient({
  initialUser,
}: {
  initialUser: {
    name?: string | null;
    bio?: string | null;
    locale?: string | null;
    timezone?: string | null;
    notificationPreferences?: unknown;
    newsletterPreferences?: unknown;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialUser.name ?? "");
  const [bio, setBio] = useState(initialUser.bio ?? "");
  const [locale, setLocale] = useState(initialUser.locale ?? "en");
  const [timezone, setTimezone] = useState(initialUser.timezone ?? "UTC");
  const [notificationPreferences, setNotificationPreferences] = useState(
    JSON.stringify(initialUser.notificationPreferences ?? { email: true, push: false }, null, 2),
  );
  const [newsletterPreferences, setNewsletterPreferences] = useState(
    JSON.stringify(initialUser.newsletterPreferences ?? { topics: ["World News", "Technology"], regions: ["Americas"] }, null, 2),
  );
  const [status, setStatus] = useState("All changes saved");
  const safeParse = (value: string) => {
    try {
      return JSON.parse(value || "{}");
    } catch {
      return {};
    }
  };
  const notificationSummary = summarizeNotificationPreferences(safeParse(notificationPreferences));
  const newsletterSummary = summarizeNewsletterPreferences(safeParse(newsletterPreferences));

  async function save() {
    try {
      setStatus("Saving...");
      const response = await fetch("/api/rest/account/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          locale,
          timezone,
          notificationPreferences: JSON.parse(notificationPreferences),
          newsletterPreferences: JSON.parse(newsletterPreferences),
        }),
      });

      setStatus(response.ok ? "All changes saved" : "Save failed");
    } catch {
      setStatus("Invalid JSON in preferences");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 p-6 text-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Breaking alerts</div>
            <div className="text-lg font-semibold">{notificationSummary.breakingNews ? "Enabled" : "Muted"}</div>
            <div className="text-[var(--muted-foreground)]">Email: {notificationSummary.email ? "On" : "Off"} | Push: {notificationSummary.push ? "Staged" : "Off"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-6 text-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Newsletter topics</div>
            <div className="text-lg font-semibold">{newsletterSummary.topics.length ? newsletterSummary.topics.slice(0, 2).join(", ") : "No topics selected"}</div>
            <div className="text-[var(--muted-foreground)]">Cadence: {newsletterSummary.cadence}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-6 text-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Edition focus</div>
            <div className="text-lg font-semibold">{newsletterSummary.regions.length ? newsletterSummary.regions.slice(0, 2).join(", ") : "Global default"}</div>
            <div className="text-[var(--muted-foreground)]">Comments: {notificationSummary.comments ? "Tracked" : "Muted"}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" />
            <Input value={locale} onChange={(event) => setLocale(event.target.value)} placeholder="Locale" />
            <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Timezone" />
            <Textarea value={bio} onChange={(event) => setBio(event.target.value)} className="min-h-[160px]" placeholder="Bio" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <Textarea value={notificationPreferences} onChange={(event) => setNotificationPreferences(event.target.value)} className="min-h-[160px]" placeholder="Notification preferences JSON" />
            <Textarea value={newsletterPreferences} onChange={(event) => setNewsletterPreferences(event.target.value)} className="min-h-[160px]" placeholder="Newsletter preferences JSON" />
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-[var(--muted-foreground)]">{status}</div>
        <Button
          onClick={() => {
            startTransition(async () => {
              await save();
            });
          }}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/lib/site";

type SettingsMap = Record<string, unknown>;

function getObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

export function AdminSettingsClient({ initialSettings }: { initialSettings: SettingsMap }) {
  const [isPending, startTransition] = useTransition();
  const identity = useMemo(() => getObject(initialSettings.site_identity), [initialSettings.site_identity]);
  const homepage = useMemo(() => getObject(initialSettings.homepage_layout), [initialSettings.homepage_layout]);
  const breaking = useMemo(() => getObject(initialSettings.breaking_news), [initialSettings.breaking_news]);
  const paywall = useMemo(() => getObject(initialSettings.paywall), [initialSettings.paywall]);
  const ads = useMemo(() => getObject(initialSettings.ads), [initialSettings.ads]);

  const [siteName, setSiteName] = useState(getString(identity.name, siteConfig.name));
  const [logoUrl, setLogoUrl] = useState(getString(identity.logoUrl));
  const [faviconUrl, setFaviconUrl] = useState(getString(identity.faviconUrl));
  const [supportEmail, setSupportEmail] = useState(getString(identity.supportEmail, "support@globalpress.network"));
  const [socialLinks, setSocialLinks] = useState(getString(identity.socialLinks, "X: https://x.com/globalpress\nLinkedIn: https://linkedin.com/company/globalpress"));
  const [heroLayout, setHeroLayout] = useState(getString(homepage.heroLayout, "breaking-led"));
  const [homepageSections, setHomepageSections] = useState(getString(homepage.sections, "breaking, top-stories, video, opinion, most-read"));
  const [breakingEnabled, setBreakingEnabled] = useState(String(Boolean(breaking.enabled ?? true)));
  const [breakingHeadline, setBreakingHeadline] = useState(getString(breaking.headline, "Live global coverage"));
  const [freeArticleLimit, setFreeArticleLimit] = useState(String(getNumber(paywall.freeArticleLimit, 5)));
  const [meteredWarning, setMeteredWarning] = useState(getString(paywall.warning, "You have reached your free article limit this month."));
  const [premiumLabel, setPremiumLabel] = useState(getString(paywall.premiumLabel, "Premium"));
  const [adPlacements, setAdPlacements] = useState(getString(ads.placements, "homepage-masthead, sidebar, in-article"));
  const theme = useMemo(() => getObject(initialSettings.theme), [initialSettings.theme]);
  const [themeMode, setThemeMode] = useState(getString(theme.mode, "system"));
  const [homepageStyle, setHomepageStyle] = useState(getString(theme.homepageStyle, "breaking-led"));
  const [typography, setTypography] = useState(getString(theme.typography, "editorial"));
  const [themeAccent, setThemeAccent] = useState(getString(theme.accent, "#b42318"));
  const [themeBackground, setThemeBackground] = useState(getString(theme.background, "#f8f5ef"));
  const [themeForeground, setThemeForeground] = useState(getString(theme.foreground, "#0f1728"));

  async function save() {
    const response = await fetch("/api/rest/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: [
          {
            key: "site_identity",
            value: {
              name: siteName,
              logoUrl,
              faviconUrl,
              supportEmail,
              socialLinks: socialLinks
                .split("\n")
                .map((entry) => entry.trim())
                .filter(Boolean),
            },
          },
          {
            key: "homepage_layout",
            value: {
              heroLayout,
              sections: homepageSections.split(",").map((item) => item.trim()).filter(Boolean),
            },
          },
          {
            key: "breaking_news",
            value: {
              enabled: breakingEnabled === "true",
              headline: breakingHeadline,
            },
          },
          {
            key: "paywall",
            value: {
              freeArticleLimit: Number(freeArticleLimit),
              warning: meteredWarning,
              premiumLabel,
            },
          },
          {
            key: "ads",
            value: {
              placements: adPlacements.split(",").map((item) => item.trim()).filter(Boolean),
            },
          },
          {
            key: "theme",
            value: {
              mode: themeMode,
              homepageStyle,
              typography,
              accent: themeAccent,
              background: themeBackground,
              foreground: themeForeground,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save settings");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Site identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={siteName} onChange={(event) => setSiteName(event.target.value)} placeholder="Site name" />
          <Input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="Logo URL" />
          <Input value={faviconUrl} onChange={(event) => setFaviconUrl(event.target.value)} placeholder="Favicon URL" />
          <Input value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} placeholder="Support email" />
          <Textarea value={socialLinks} onChange={(event) => setSocialLinks(event.target.value)} className="min-h-[120px]" placeholder="One social link per line" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Homepage and paywall</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={heroLayout} onChange={(event) => setHeroLayout(event.target.value)} placeholder="Hero layout" />
          <Input value={homepageSections} onChange={(event) => setHomepageSections(event.target.value)} placeholder="Homepage sections" />
          <Input value={breakingEnabled} onChange={(event) => setBreakingEnabled(event.target.value)} placeholder="Breaking enabled true/false" />
          <Input value={breakingHeadline} onChange={(event) => setBreakingHeadline(event.target.value)} placeholder="Breaking headline" />
          <Input value={freeArticleLimit} onChange={(event) => setFreeArticleLimit(event.target.value)} placeholder="Free article limit" />
          <Input value={premiumLabel} onChange={(event) => setPremiumLabel(event.target.value)} placeholder="Premium label" />
          <Textarea value={meteredWarning} onChange={(event) => setMeteredWarning(event.target.value)} className="min-h-[120px]" placeholder="Metered warning copy" />
          <Input value={adPlacements} onChange={(event) => setAdPlacements(event.target.value)} placeholder="Ad placements" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Theme controls</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={themeMode} onChange={(event) => setThemeMode(event.target.value)} placeholder="Theme mode" />
          <Input value={homepageStyle} onChange={(event) => setHomepageStyle(event.target.value)} placeholder="Homepage style" />
          <Input value={typography} onChange={(event) => setTypography(event.target.value)} placeholder="Typography preset" />
          <Input value={themeAccent} onChange={(event) => setThemeAccent(event.target.value)} placeholder="Accent color" />
          <Input value={themeBackground} onChange={(event) => setThemeBackground(event.target.value)} placeholder="Background color" />
          <Input value={themeForeground} onChange={(event) => setThemeForeground(event.target.value)} placeholder="Foreground color" />
        </CardContent>
      </Card>
      <div className="xl:col-span-2 flex justify-end">
        <Button
          onClick={() => {
            startTransition(async () => {
              await save();
            });
          }}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save launch settings"}
        </Button>
      </div>
    </div>
  );
}

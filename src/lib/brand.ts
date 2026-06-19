import "server-only";
import { cache } from "react";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import { brandThemeStyle, type BrandTheme } from "@/lib/brand-theme";

export type BrandConfig = {
  name: string;
  slogan: string;
  footerCopy: string;
  logoUrl: string;
  faviconUrl: string;
  supportEmail: string;
  socialLinks: string[];
  theme: BrandTheme;
};

const fallback: BrandConfig = {
  name: siteConfig.name,
  slogan: "",
  footerCopy:
    "Breaking news, world coverage, business intelligence, and global reporting from a premium international newsroom.",
  logoUrl: "/vanterenpress-broadcast-logo.png",
  faviconUrl: "/favicon.ico",
  supportEmail: "support@vanterenpress.com",
  socialLinks: [
    "X: https://x.com/vanterenpress",
    "Facebook: https://facebook.com/vanterenpress",
    "LinkedIn: https://linkedin.com/company/vanterenpress",
    "YouTube: https://youtube.com/@vanterenpress",
    "Instagram: https://instagram.com/vanterenpress",
  ],
  theme: {
    mode: "system",
    homepageStyle: "breaking-led",
    typography: "editorial",
    colors: {
      background: "#F8F8F8",
      foreground: "#111111",
      panel: "#FFFFFF",
      muted: "#F3F4F6",
      mutedForeground: "#6B7280",
      border: "#E5E7EB",
      accent: "#D71920",
      accentSoft: "rgba(215,25,32,0.1)",
    },
  },
};

function normalizeString(value: unknown, fallbackValue: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallbackValue;
}

function getSetting(settings: { key: string; value: unknown }[], key: string) {
  return settings.find((item) => item.key === key)?.value;
}

export const getBrandConfig = cache(async (): Promise<BrandConfig> => {
  if (!await isDatabaseAvailable()) {
    return fallback;
  }

  try {
    const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
    const identity = (getSetting(settings, "site_identity") ?? {}) as Record<string, unknown>;
    const theme = (getSetting(settings, "theme") ?? {}) as Record<string, unknown>;

    return {
      name: normalizeString(identity.name, fallback.name),
      slogan: normalizeString(identity.slogan, fallback.slogan),
      footerCopy: normalizeString(identity.footerCopy, fallback.footerCopy),
      logoUrl: normalizeString(identity.logoUrl, fallback.logoUrl),
      faviconUrl: normalizeString(identity.faviconUrl, fallback.faviconUrl),
      supportEmail: normalizeString(identity.supportEmail, fallback.supportEmail),
      socialLinks: Array.isArray(identity.socialLinks)
        ? identity.socialLinks.map((item) => String(item)).filter(Boolean)
        : fallback.socialLinks,
      theme: {
        mode: theme.mode === "light" || theme.mode === "dark" || theme.mode === "system" ? theme.mode : fallback.theme.mode,
        homepageStyle:
          theme.homepageStyle === "classic" || theme.homepageStyle === "magazine"
            ? theme.homepageStyle
            : fallback.theme.homepageStyle,
        typography:
          theme.typography === "modern" || theme.typography === "compact"
            ? theme.typography
            : fallback.theme.typography,
        colors: {
          background: normalizeString(theme.background, fallback.theme.colors.background),
          foreground: normalizeString(theme.foreground, fallback.theme.colors.foreground),
          panel: normalizeString(theme.panel, fallback.theme.colors.panel),
          muted: normalizeString(theme.muted, fallback.theme.colors.muted),
          mutedForeground: normalizeString(theme.mutedForeground, fallback.theme.colors.mutedForeground),
          border: normalizeString(theme.border, fallback.theme.colors.border),
          accent: normalizeString(theme.accent, fallback.theme.colors.accent),
          accentSoft: normalizeString(theme.accentSoft, fallback.theme.colors.accentSoft),
        },
      },
    };
  } catch {
    return fallback;
  }
});

export { brandThemeStyle };

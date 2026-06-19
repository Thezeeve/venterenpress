import type { CSSProperties } from "react";

export type BrandTheme = {
  mode: "light" | "dark" | "system";
  homepageStyle: "breaking-led" | "classic" | "magazine";
  typography: "editorial" | "modern" | "compact";
  colors: {
    background: string;
    foreground: string;
    panel: string;
    muted: string;
    mutedForeground: string;
    border: string;
    accent: string;
    accentSoft: string;
  };
};

export function brandThemeStyle(theme: BrandTheme) {
  return {
    ["--background" as string]: theme.colors.background,
    ["--foreground" as string]: theme.colors.foreground,
    ["--panel" as string]: theme.colors.panel,
    ["--muted" as string]: theme.colors.muted,
    ["--muted-foreground" as string]: theme.colors.mutedForeground,
    ["--border" as string]: theme.colors.border,
    ["--accent" as string]: theme.colors.accent,
    ["--accent-soft" as string]: theme.colors.accentSoft,
  } as CSSProperties;
}


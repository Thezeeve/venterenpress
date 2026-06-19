import { describe, expect, it } from "vitest";
import { brandThemeStyle } from "@/lib/brand-theme";

describe("brand theme style", () => {
  it("maps theme colors to css variables", () => {
    const style = brandThemeStyle({
      mode: "dark",
      homepageStyle: "classic",
      typography: "modern",
      colors: {
        background: "#111111",
        foreground: "#eeeeee",
        panel: "#222222",
        muted: "#333333",
        mutedForeground: "#aaaaaa",
        border: "#444444",
        accent: "#ff0000",
        accentSoft: "#550000",
      },
    });

    expect(style["--background"]).toBe("#111111");
    expect(style["--accent"]).toBe("#ff0000");
    expect(style["--foreground"]).toBe("#eeeeee");
  });

  it("preserves newsroom-specific palette keys used by brand settings", () => {
    const style = brandThemeStyle({
      mode: "system",
      homepageStyle: "magazine",
      typography: "editorial",
      colors: {
        background: "#f8f5ef",
        foreground: "#0f1728",
        panel: "rgba(255,255,255,0.82)",
        muted: "#ebe6dc",
        mutedForeground: "#5f6b7a",
        border: "rgba(15,23,40,0.12)",
        accent: "#b42318",
        accentSoft: "rgba(180,35,24,0.1)",
      },
    });

    expect(style["--panel"]).toContain("255");
    expect(style["--muted-foreground"]).toBe("#5f6b7a");
    expect(style["--accent-soft"]).toContain("180");
  });
});

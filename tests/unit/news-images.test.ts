import { describe, expect, it } from "vitest";
import { resolveNewsImageSelection } from "@/lib/news-providers/sanitize-news-image";

describe("news image selection", () => {
  it("does not force a weak image fallback for unrelated stories", () => {
    const result = resolveNewsImageSelection({
      slug: "municipal-bond-calendar",
      category: "Local Briefing",
      title: "Community calendar updates",
      summary: "A short notice about weekend closures and civic schedules.",
      preferPremium: true,
      minimumScore: 28,
    });

    expect(result.isStrongMatch).toBe(false);
    expect(result.imageUrl).toBeNull();
  });

  it("avoids repeating the same curated image when an image is already used", () => {
    const first = resolveNewsImageSelection({
      slug: "spain-held-to-draw",
      category: "Sports",
      title: "Spain held to draw in opening campaign",
      summary: "Spain dropped points in its first World Cup match.",
      preferPremium: true,
      minimumScore: 28,
    });
    const second = resolveNewsImageSelection({
      slug: "world-cup-host-cities",
      category: "Sports",
      title: "World Cup host cities prepare",
      summary: "Tournament organizers ramp up operations.",
      usedImages: first.imageUrl ? [first.imageUrl] : [],
      preferPremium: true,
      minimumScore: 28,
    });

    expect(first.imageUrl).not.toBeNull();
    expect(second.imageUrl).not.toBe(first.imageUrl);
  });
});

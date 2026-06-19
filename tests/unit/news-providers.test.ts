import { afterEach, describe, expect, it } from "vitest";
import { getHomepageNewsBundle, resetHomepageNewsInMemoryCache } from "@/lib/news-providers";
import { getFallbackImageForCategory, sanitizeNewsImage } from "@/lib/news-providers/sanitize-news-image";
import { getSeedHomepageBundle, getSeedStoryBySlug } from "@/lib/news-providers/seed-content";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  resetHomepageNewsInMemoryCache();
});

describe("news provider bundle", () => {
  it("returns a fully populated seed homepage bundle", () => {
    const bundle = getSeedHomepageBundle();

    expect(bundle.heroStory.title).toContain("SpaceX IPO Speculation");
    expect(bundle.latestSidebar).toHaveLength(8);
    expect(bundle.topStories.length).toBeGreaterThan(0);
    expect(bundle.worldNews.length).toBeGreaterThan(0);
    expect(bundle.businessNews.length).toBeGreaterThan(0);
    expect(bundle.technologyNews.length).toBeGreaterThan(0);
    expect(bundle.sportsNews.length).toBeGreaterThan(0);
    expect(bundle.liveCoverage.length).toBeGreaterThan(0);
    expect(bundle.opinion.length).toBeGreaterThan(0);
    expect(bundle.mostRead.length).toBeGreaterThan(0);
  });

  it("finds seeded stories by slug", () => {
    const story = getSeedStoryBySlug("fifa-world-cup-2026-preparations-intensify-across-host-cities");

    expect(story?.category).toBe("Sports");
    expect(story?.featuredImageUrl).toContain("fifa-world-cup-2026");
  });

  it("falls back to seed content in live mode when providers are unavailable", async () => {
    process.env.NEWS_MODE = "live";
    process.env.ENABLE_RSS_NEWS = "false";
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;
    delete process.env.GUARDIAN_OPEN_PLATFORM_KEY;
    delete process.env.GNEWS_API_KEY;
    delete process.env.NEWS_API_KEY;
    delete process.env.CURRENTS_API_KEY;
    delete process.env.THENEWSAPI_API_TOKEN;
    delete process.env.ALPHA_VANTAGE_API_KEY;
    delete process.env.FINNHUB_API_KEY;
    delete process.env.COINGECKO_API_KEY;

    const bundle = await getHomepageNewsBundle();

    expect(bundle.mode).toBe("seed");
    expect(bundle.heroStory.title).toContain("SpaceX IPO Speculation");
  }, 15000);

  it("never keeps boxing gloves for AI stories", () => {
    expect(
      sanitizeNewsImage({
        category: "Technology",
        title: "AI investment accelerates",
        imageUrl: "https://cdn.example.com/red-boxing-gloves.jpg",
      }),
    ).toBe("/news/technology/tech3.jpg");
  });

  it("blocks technology imagery from world conflict stories", () => {
    expect(
      sanitizeNewsImage({
        category: "World",
        title: "Iran attack raises fears of wider regional conflict",
        imageUrl: "/news/technology/tech4.jpg",
      }),
    ).toBe("/news/world/world5.jpg");
  });

  it("forces SpaceX stories away from football imagery", () => {
    expect(
      sanitizeNewsImage({
        category: "Business",
        title: "SpaceX IPO speculation grows",
        imageUrl: "https://cdn.example.com/american-football.jpg",
      }),
    ).toBe("/news/technology/business7.jpg");
  });

  it("replaces remote sports imagery with curated local sports art", () => {
    expect(
      sanitizeNewsImage({
        category: "Sports",
        title: "FIFA World Cup 2026 preparations intensify",
        imageUrl: "https://cdn.example.com/fifa-world-cup-football-stadium.jpg",
      }),
    ).toBe("/news/sports/world-cup-2026.jpg");
  });

  it("blocks sports images from Apple technology stories", () => {
    expect(
      sanitizeNewsImage({
        category: "Technology",
        title: "Apple expands AI software push across devices",
        imageUrl: "/news/sports/football2.jpg",
      }),
    ).toBe("/news/technology/tech3.jpg");
  });

  it("keeps opinion coverage on editorial imagery", () => {
    expect(
      sanitizeNewsImage({
        category: "Opinion",
        title: "Editorial analysis of the global media landscape",
        imageUrl: "/news/business/business4.jpg",
      }),
    ).toBe("/news/opinion/opinion1.jpg");
  });

  it("returns no image when topic confidence is weak", () => {
    expect(
      sanitizeNewsImage({
        category: "World",
        title: "Regional planning officials review long-range resilience proposals",
        summary: "A cross-agency working group is studying implementation scenarios and public guidance.",
      }),
    ).toBeNull();
  });

  it("returns strict local fallbacks by category", () => {
    expect(getFallbackImageForCategory("World")).toMatch(/^\/news\/world\//);
    expect(getFallbackImageForCategory("Business")).toMatch(/^\/news\/business\//);
    expect(getFallbackImageForCategory("Technology")).toMatch(/^\/news\/technology\//);
    expect(getFallbackImageForCategory("Sports")).toMatch(/^\/news\/sports\//);
    expect(getFallbackImageForCategory("Opinion")).toMatch(/^\/news\/opinion\//);
    expect(getFallbackImageForCategory("Business", "SpaceX IPO speculation grows")).toBe(
      "/news/technology/business7.jpg",
    );
  });
});

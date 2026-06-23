import { describe, expect, it } from "vitest";
import {
  applyHomepageHeroSelection,
  isHeroWindowActive,
  selectActiveHomepageHeroArticles,
  toEditorialStoryFromArticle,
} from "@/lib/homepage-hero";
import { getSeedHomepageBundle } from "@/lib/news-providers/seed-content";

describe("homepage hero selection", () => {
  it("uses the manually selected hero when available", () => {
    const bundle = getSeedHomepageBundle();
    const manualHero = {
      ...bundle.topStories[0]!,
      id: "manual-hero",
      slug: "manual-hero-story",
      title: "Manual hero story",
      provider: "cms",
      storySourceType: "manual" as const,
      isExternal: false,
      href: "/articles/manual-hero-story",
    };

    const updated = applyHomepageHeroSelection(bundle, manualHero, null);

    expect(updated.heroStory.id).toBe("manual-hero");
    expect(updated.heroStory.title).toBe("Manual hero story");
    expect(updated.topStories.some((story) => story.id === "manual-hero")).toBe(false);
  });

  it("falls back to the latest published non-deleted article when no manual hero exists", () => {
    const bundle = getSeedHomepageBundle();
    const fallbackHero = toEditorialStoryFromArticle({
      id: "article-1",
      slug: "latest-published-story",
      title: "Latest published story",
      excerpt: "Latest fallback coverage for homepage hero selection.",
      body: { type: "doc", content: [{ type: "paragraph", text: "Lead paragraph." }] },
      featuredImageUrl: null,
      featuredImageAlt: null,
      publishedAt: new Date("2026-06-21T08:00:00.000Z"),
      updatedAt: new Date("2026-06-21T08:00:00.000Z"),
      readingTimeMinutes: 4,
      articleType: "NEWS",
      author: { name: "Editor", email: "editor@example.com" },
      edition: { name: "Africa", region: "Africa" },
      categories: [{ category: { name: "World" } }],
      tags: [],
    });

    const updated = applyHomepageHeroSelection(bundle, null, fallbackHero);

    expect(updated.heroStory.id).toBe("article-1");
    expect(updated.heroStory.slug).toBe("latest-published-story");
    expect(updated.heroStory.provider).toBe("cms");
  });

  it("prioritizes additional published cms stories ahead of fallback top stories", () => {
    const bundle = getSeedHomepageBundle();
    const cmsStories = [
      {
        ...bundle.topStories[0]!,
        id: "cms-2",
        slug: "cms-story-2",
        title: "CMS story two",
        provider: "cms",
        storySourceType: "manual" as const,
        href: "/articles/cms-story-2",
      },
      {
        ...bundle.topStories[1]!,
        id: "cms-3",
        slug: "cms-story-3",
        title: "CMS story three",
        provider: "cms",
        storySourceType: "manual" as const,
        href: "/articles/cms-story-3",
      },
    ];

    const updated = applyHomepageHeroSelection(bundle, null, bundle.heroStory, cmsStories);

    expect(updated.heroCarouselStories[0]?.id).toBe("cms-2");
    expect(updated.heroCarouselStories[1]?.id).toBe("cms-3");
  });

  it("drops non-manual stories if they accidentally enter hero selection", () => {
    const bundle = getSeedHomepageBundle();

    const updated = applyHomepageHeroSelection(bundle, null, bundle.heroStory, [
      {
        ...bundle.topStories[0]!,
        id: "manual-hero",
        provider: "cms",
        storySourceType: "manual",
      },
      {
        ...bundle.topStories[1]!,
        id: "live-hero",
        provider: "gnews",
        storySourceType: "live",
      },
    ]);

    expect(updated.heroCarouselStories.map((story) => story.id)).toEqual(["manual-hero"]);
  });

  it("filters expired hero articles while keeping non-expired ones available for hero selection", () => {
    const now = new Date("2026-06-23T12:00:00.000Z");
    const activeHeroes = selectActiveHomepageHeroArticles([
      { id: "active", showOnHero: true, heroStartAt: "2026-06-23T10:00:00.000Z", heroEndAt: "2026-06-23T14:00:00.000Z" },
      { id: "expired", showOnHero: true, heroStartAt: "2026-06-22T10:00:00.000Z", heroEndAt: "2026-06-23T11:59:59.000Z" },
      { id: "scheduled", showOnHero: true, heroStartAt: "2026-06-23T12:30:00.000Z", heroEndAt: null },
    ], now);

    expect(activeHeroes.map((article) => article.id)).toEqual(["active"]);
    expect(isHeroWindowActive({
      showOnHero: true,
      heroStartAt: "2026-06-22T10:00:00.000Z",
      heroEndAt: "2026-06-23T11:59:59.000Z",
    }, now)).toBe(false);
  });

  it("caps the active hero list at seven articles", () => {
    const activeHeroes = selectActiveHomepageHeroArticles(
      Array.from({ length: 8 }, (_, index) => ({
        id: `hero-${index + 1}`,
        showOnHero: true,
        heroStartAt: "2026-06-23T08:00:00.000Z",
        heroEndAt: null,
      })),
      new Date("2026-06-23T12:00:00.000Z"),
    );

    expect(activeHeroes).toHaveLength(7);
    expect(activeHeroes.map((article) => article.id)).toEqual([
      "hero-1",
      "hero-2",
      "hero-3",
      "hero-4",
      "hero-5",
      "hero-6",
      "hero-7",
    ]);
  });
});

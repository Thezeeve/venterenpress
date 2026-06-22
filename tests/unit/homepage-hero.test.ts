import { describe, expect, it } from "vitest";
import { applyHomepageHeroSelection, toEditorialStoryFromArticle } from "@/lib/homepage-hero";
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
        href: "/articles/cms-story-2",
      },
      {
        ...bundle.topStories[1]!,
        id: "cms-3",
        slug: "cms-story-3",
        title: "CMS story three",
        provider: "cms",
        href: "/articles/cms-story-3",
      },
    ];

    const updated = applyHomepageHeroSelection(bundle, null, bundle.heroStory, cmsStories);

    expect(updated.topStories[0]?.id).toBe("cms-2");
    expect(updated.topStories[1]?.id).toBe("cms-3");
  });
});

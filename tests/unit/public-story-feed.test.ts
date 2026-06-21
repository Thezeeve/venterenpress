import { afterEach, describe, expect, it, vi } from "vitest";
import { getSeedHomepageBundle } from "@/lib/news-providers/seed-content";

vi.mock("@/lib/news-providers", () => ({
  getHomepageNewsResponse: vi.fn(async () => ({
    bundle: getSeedHomepageBundle(),
  })),
}));

import {
  dedupePublicStoriesById,
  dedupePublicStoryImages,
  filterRenderableNewsroomArticles,
  filterRenderablePublicStories,
  getCategoryStories,
  getSectionStories,
  getTopicStories,
  getVisiblePublicNavItems,
} from "@/lib/public-story-feed";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("public story feed integrity", () => {
  it("keeps section pages on exact category matches", async () => {
    delete process.env.DATABASE_URL;

    const [businessStories, opinionStories, sportsStories, worldStories] = await Promise.all([
      getSectionStories("business"),
      getSectionStories("opinion"),
      getSectionStories("sports"),
      getSectionStories("world"),
    ]);

    expect(businessStories.length).toBeGreaterThan(0);
    expect(businessStories.every((story) => story.category === "Business")).toBe(true);
    expect(opinionStories.length).toBeGreaterThan(0);
    expect(opinionStories.every((story) => story.category === "Opinion")).toBe(true);
    expect(sportsStories.length).toBeGreaterThan(0);
    expect(sportsStories.every((story) => story.category === "Sports")).toBe(true);
    expect(worldStories.length).toBeGreaterThan(0);
    expect(worldStories.every((story) => story.category === "World")).toBe(true);
  });

  it("leaves empty categories empty instead of backfilling unrelated stories", async () => {
    delete process.env.DATABASE_URL;

    const [financeStories, politicsStories, financeCategoryStories] = await Promise.all([
      getSectionStories("finance"),
      getTopicStories("politics"),
      getCategoryStories("finance"),
    ]);

    expect(financeStories).toEqual([]);
    expect(politicsStories).toEqual([]);
    expect(financeCategoryStories).toEqual([]);
  });

  it("hides empty public tabs from navigation", async () => {
    delete process.env.DATABASE_URL;

    const navItems = await getVisiblePublicNavItems();
    const labels = navItems.map((item) => item.label);

    expect(labels).toContain("Home");
    expect(labels).toContain("World");
    expect(labels).toContain("Business");
    expect(labels).toContain("Technology");
    expect(labels).toContain("Sports");
    expect(labels).toContain("Opinion");
    expect(labels).not.toContain("Finance");
    expect(labels).not.toContain("Politics");
  });

  it("deduplicates repeated card images per page and falls back to text-only cards", () => {
    const stories = dedupePublicStoryImages([
      { id: "1", imageUrl: "/news/world/world1.jpg" },
      { id: "2", imageUrl: "/news/world/world1.jpg" },
      { id: "3", imageUrl: "/news/world/world2.jpg" },
      { id: "4", imageUrl: "/news/world/world2.jpg" },
      { id: "5", imageUrl: null },
    ]);

    expect(stories[0]?.imageUrl).toBe("/news/world/world1.jpg");
    expect(stories[1]?.imageUrl).toBeNull();
    expect(stories[2]?.imageUrl).toBe("/news/world/world2.jpg");
    expect(stories[3]?.imageUrl).toBeNull();
    expect(stories[4]?.imageUrl).toBeNull();
  });

  it("deduplicates repeated stories by article id before rendering", () => {
    const stories = dedupePublicStoriesById([
      { id: "article-1", slug: "alpha" },
      { id: "article-2", slug: "alpha" },
      { id: "article-3", slug: "beta" },
    ]);

    expect(stories).toHaveLength(2);
    expect(stories.map((story) => story.id)).toEqual(["article-1", "article-3"]);
  });

  it("filters soft-deleted public stories before rendering cards", () => {
    const stories = filterRenderablePublicStories([
      { id: "article-1", slug: "visible", href: "/articles/visible", title: "Visible", excerpt: null, category: "World", publishedAt: null, imageUrl: null, imageAlt: null, deletedAt: null, status: "PUBLISHED" },
      { id: "article-2", slug: "deleted", href: "/articles/deleted", title: "Deleted", excerpt: null, category: "World", publishedAt: null, imageUrl: null, imageAlt: null, deletedAt: new Date(), status: "PUBLISHED" },
    ]);

    expect(stories).toHaveLength(1);
    expect(stories[0]?.slug).toBe("visible");
  });

  it("filters soft-deleted newsroom articles before rendering discovery links", () => {
    const articles = filterRenderableNewsroomArticles([
      { id: "article-1", slug: "visible", deletedAt: null, status: "PUBLISHED" },
      { id: "article-2", slug: "deleted", deletedAt: new Date(), status: "PUBLISHED" },
    ]);

    expect(articles).toHaveLength(1);
    expect(articles[0]?.slug).toBe("visible");
  });
});

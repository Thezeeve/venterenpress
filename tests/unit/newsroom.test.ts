import { describe, expect, it } from "vitest";
import {
  buildArticleTrustMeta,
  buildShareLinks,
  editionCodeToSlug,
  publicRouteCatalog,
  rankRecommendedArticles,
  slugifyValue,
  summarizeNewsletterPreferences,
  summarizeNotificationPreferences,
} from "@/lib/newsroom";

describe("newsroom helpers", () => {
  it("normalizes edition codes to route slugs", () => {
    expect(editionCodeToSlug("UNITED_STATES")).toBe("united-states");
    expect(editionCodeToSlug("MIDDLE_EAST")).toBe("middle-east");
  });

  it("slugifies editorial labels", () => {
    expect(slugifyValue("Global Markets & AI")).toBe("global-markets-and-ai");
  });

  it("ranks articles using follows, topics, and recency", () => {
    const articles = [
      {
        id: "a",
        slug: "a",
        title: "Older matched story",
        excerpt: null,
        featuredImageUrl: null,
        featuredImageAlt: null,
        articleType: "NEWS",
        accessTier: "FREE",
        readingTimeMinutes: 4,
        publishedAt: new Date("2025-01-01T00:00:00.000Z"),
        edition: { id: "ed-1", name: "United States", code: "UNITED_STATES", region: "Americas" },
        author: { id: "author-1", name: null, email: null, bio: null, isVerifiedJournalist: false },
        categories: [{ category: { id: "cat-1", slug: "technology", name: "Technology" } }],
        tags: [],
      },
      {
        id: "b",
        slug: "b",
        title: "Followed journalist story",
        excerpt: null,
        featuredImageUrl: null,
        featuredImageAlt: null,
        articleType: "NEWS",
        accessTier: "FREE",
        readingTimeMinutes: 4,
        publishedAt: new Date("2025-06-01T00:00:00.000Z"),
        edition: { id: "ed-2", name: "Europe", code: "EUROPE", region: "Europe" },
        author: { id: "author-2", name: null, email: null, bio: null, isVerifiedJournalist: false },
        categories: [{ category: { id: "cat-2", slug: "politics", name: "Politics" } }],
        tags: [],
      },
    ];

    const ranked = rankRecommendedArticles(articles, {
      savedCategorySlugs: ["technology"],
      followedAuthorIds: ["author-2"],
      historyCategorySlugs: [],
      historyArticleIds: [],
      favoriteEditionIds: [],
    });

    expect(ranked[0].id).toBe("b");
  });

  it("summarizes newsletter and notification preferences", () => {
    const newsletter = summarizeNewsletterPreferences({
      topics: ["Technology", "Opinion"],
      regions: ["Africa"],
      cadence: "Weekend",
    });
    const notifications = summarizeNotificationPreferences({
      email: true,
      push: false,
      breakingNews: true,
      comments: false,
    });

    expect(newsletter.topics).toEqual(["Technology", "Opinion"]);
    expect(newsletter.regions).toEqual(["Africa"]);
    expect(newsletter.cadence).toBe("Weekend");
    expect(notifications.breakingNews).toBe(true);
    expect(notifications.comments).toBe(false);
  });

  it("builds article trust metadata and share links", () => {
    const trust = buildArticleTrustMeta({
      reviewStepDecision: "APPROVED",
      articleStatus: "PUBLISHED",
      editionName: "United States",
      hasCorrections: true,
      citationCount: 3,
      primaryCategory: "Technology",
    });
    const shareLinks = buildShareLinks(
      { slug: "global-chip-alliances", title: "Global chip alliances" },
      "https://globalpress.network",
    );

    expect(trust.factCheckLabel).toBe("Fact-check verified");
    expect(trust.correctionLabel).toContain("Correction history");
    expect(trust.storyMatters).toHaveLength(3);
    expect(shareLinks).toHaveLength(3);
    expect(shareLinks[0].href).toContain("twitter.com");
  });

  it("tracks the primary public route catalog", () => {
    expect(publicRouteCatalog).toContain("/");
    expect(publicRouteCatalog).toContain("/latest");
    expect(publicRouteCatalog).toContain("/rss");
  });
});

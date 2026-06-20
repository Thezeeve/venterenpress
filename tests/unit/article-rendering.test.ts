import { describe, expect, it } from "vitest";
import { resolveArticleHeroImage, selectArticlePageSource } from "@/lib/article-rendering";

describe("article rendering helpers", () => {
  it("prefers the uploaded featured image over fallback images", () => {
    expect(resolveArticleHeroImage({
      slug: "global-chip-alliances",
      category: "Technology",
      title: "Global chip alliances reshape AI infrastructure competition",
      summary: "Governments and hyperscale platforms are redrawing semiconductor strategy.",
      featuredImageUrl: "https://cdn.example.com/uploads/fresh-image.png",
      imageUrl: "https://cdn.example.com/legacy-image.png",
    })).toBe("https://cdn.example.com/uploads/fresh-image.png");
  });

  it("prefers the stored article over an external fallback story with the same slug", () => {
    expect(selectArticlePageSource({
      article: { id: "article-1", featuredImageUrl: "https://cdn.example.com/uploads/fresh-image.png" },
      externalStory: { id: "external-1", featuredImageUrl: "https://cdn.example.com/legacy-image.png" },
    })).toEqual({
      kind: "article",
      article: { id: "article-1", featuredImageUrl: "https://cdn.example.com/uploads/fresh-image.png" },
      externalStory: null,
    });
  });
});

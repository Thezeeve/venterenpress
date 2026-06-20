import { describe, expect, it } from "vitest";
import {
  ARTICLE_IMAGE_MAX_BYTES,
  articleBodyToEditorHtml,
  buildArticlePayload,
  htmlToArticleBody,
  validateEditorIssues,
  validateArticleImageFile,
  validateEditorValues,
} from "@/lib/article-editor";

describe("article editor helpers", () => {
  it("validates required newsroom fields", () => {
    const error = validateEditorValues(
      {
        title: "Short",
        slug: "",
        excerpt: "Too short",
        categories: "",
        tags: "",
        editionCode: "AFRICA",
        seoTitle: "",
        seoDescription: "",
        featuredImageUrl: "",
        featuredImageAlt: "",
      },
      "<p></p>",
    );

    expect(error).toBe("Title must be at least 10 characters.");
  });

  it("converts preview html into article body nodes", () => {
    const body = htmlToArticleBody("<h2>Lead</h2><p>First paragraph.</p><ul><li>One</li><li>Two</li></ul>");
    expect(body.content).toEqual([
      { type: "heading", level: 2, text: "Lead" },
      { type: "paragraph", text: "First paragraph." },
      { type: "bulletList", items: ["One", "Two"] },
    ]);
  });

  it("parses article html without DOMParser during server rendering", () => {
    const originalDomParser = globalThis.DOMParser;
    // Simulate the production server render path where browser DOM APIs are unavailable.
    // @ts-expect-error test-only override
    delete globalThis.DOMParser;

    try {
      const body = htmlToArticleBody("<h3>Deck</h3><blockquote><p>Quoted context.</p></blockquote><p>Body copy.</p>");
      expect(body.content).toEqual([
        { type: "heading", level: 3, text: "Deck" },
        { type: "blockquote", text: "Quoted context." },
        { type: "paragraph", text: "Body copy." },
      ]);
    } finally {
      globalThis.DOMParser = originalDomParser;
    }
  });

  it("builds published payloads for the article API", () => {
    const payload = buildArticlePayload(
      {
        title: "Global chip alliances reshape AI infrastructure competition",
        slug: "",
        excerpt: "Governments and hyperscale platforms are redrawing semiconductor strategy around energy, supply chains, and sovereign cloud capacity.",
        categories: "technology, finance",
        tags: "ai, chips",
        editionCode: "UNITED_STATES",
        seoTitle: "AI infrastructure competition",
        seoDescription: "A briefing on AI infrastructure competition.",
        featuredImageUrl: "https://example.com/image.jpg",
        featuredImageAlt: "Data center exterior",
      },
      "<p>Lead paragraph.</p>",
      "publish",
    );

    expect(payload.status).toBe("PUBLISHED");
    expect(payload.categorySlugs).toEqual(["technology", "finance"]);
    expect(payload.tagSlugs).toEqual(["ai", "chips"]);
    expect(payload.body).toEqual({
      type: "doc",
      content: [{ type: "paragraph", text: "Lead paragraph." }],
    });
  });

  it("serializes stored article body back into editor html", () => {
    const html = articleBodyToEditorHtml({
      type: "doc",
      content: [
        { type: "heading", level: 2, text: "Heading" },
        { type: "paragraph", text: "Body copy" },
      ],
    });

    expect(html).toContain("<h2>Heading</h2>");
    expect(html).toContain("<p>Body copy</p>");
  });

  it("allows image uploads up to 10MB and rejects larger files", () => {
    const allowedFile = new File([new Uint8Array(ARTICLE_IMAGE_MAX_BYTES)], "hero.jpeg", { type: "image/jpeg" });
    const oversizedFile = new File([new Uint8Array(ARTICLE_IMAGE_MAX_BYTES + 1)], "hero.jpeg", { type: "image/jpeg" });

    expect(validateArticleImageFile(allowedFile)).toBeNull();
    expect(validateArticleImageFile(oversizedFile)).toBe("Image must be 10MB or smaller.");
  });

  it("returns a visible validation issue list for blocked publish actions", () => {
    expect(validateEditorIssues({
      title: "",
      slug: "",
      excerpt: "",
      categories: "",
      tags: "",
      editionCode: "AFRICA",
      seoTitle: "",
      seoDescription: "",
      featuredImageUrl: "",
      featuredImageAlt: "",
    }, "<p></p>")).toEqual([
      "Title required.",
      "Slug required.",
      "Summary required.",
      "Category required.",
      "Body required.",
    ]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARTICLE_IMAGE_MAX_BYTES,
  articleBodyToEditorHtml,
  buildArticlePayload,
  extractApiFieldErrors,
  getEditorFieldErrors,
  htmlToArticleBody,
  validateEditorIssues,
  validateArticleImageFile,
  validateEditorValues,
  type EditorFormValues,
} from "@/lib/article-editor";

function createEditorValues(overrides: Partial<EditorFormValues> = {}): EditorFormValues {
  return {
    title: "Global chip alliances reshape AI infrastructure competition",
    slug: "global-chip-alliances",
    excerpt: "Governments and hyperscale platforms are redrawing semiconductor strategy around energy, supply chains, and sovereign cloud capacity.",
    categories: "technology, finance",
    tags: "ai, chips",
    editionCode: "UNITED_STATES",
    seoTitle: "",
    seoDescription: "",
    featuredImageUrl: "",
    featuredImageAlt: "",
    showOnHero: false,
    heroStartMode: "immediate",
    heroStartDate: "",
    heroStartTime: "",
    heroEndEnabled: false,
    heroEndDate: "",
    heroEndTime: "",
    heroPriority: "",
    ...overrides,
  };
}

describe("article editor helpers", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("validates required newsroom fields", () => {
    const error = validateEditorValues(
      createEditorValues({
        title: "Short",
        slug: "",
        excerpt: "Too short",
        categories: "",
      }),
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

  it("builds published payloads for scheduled homepage hero articles", () => {
    const payload = buildArticlePayload(
      createEditorValues({
        showOnHero: true,
        heroStartMode: "scheduled",
        heroStartDate: "2026-06-23",
        heroStartTime: "09:00",
        heroEndEnabled: true,
        heroEndDate: "2026-06-24",
        heroEndTime: "09:00",
        heroPriority: "3",
        seoTitle: "AI infrastructure competition",
        seoDescription: "A briefing on AI infrastructure competition.",
        featuredImageUrl: "https://example.com/image.jpg",
        featuredImageAlt: "Data center exterior",
      }),
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
    expect(payload.seoTitle).toBe("AI infrastructure competition");
    expect(payload.seoDescription).toBe("A briefing on AI infrastructure competition.");
    expect(payload.showOnHero).toBe(true);
    expect(payload.heroStartAt).toBe(new Date(2026, 5, 23, 9, 0, 0, 0).toISOString());
    expect(payload.heroEndAt).toBe(new Date(2026, 5, 24, 9, 0, 0, 0).toISOString());
    expect(payload.heroPriority).toBe(3);
  });

  it("uses the current ISO datetime when hero start is immediate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-26T10:30:00.000Z"));

    const payload = buildArticlePayload(
      createEditorValues({
        showOnHero: true,
      }),
      "<p>Lead paragraph.</p>",
      "draft",
    );

    expect(payload.heroStartAt).toBe("2026-06-26T10:30:00.000Z");
    expect(payload.heroEndAt).toBeNull();
    expect(payload.heroPriority).toBe(100);
  });

  it("normalizes blank optional fields to null instead of empty strings", () => {
    const payload = buildArticlePayload(
      createEditorValues({
        categories: "technology",
        tags: "",
        seoTitle: "   ",
        seoDescription: "   ",
        featuredImageUrl: "   ",
        featuredImageAlt: "   ",
        showOnHero: false,
      }),
      "<p>Lead paragraph.</p>",
      "draft",
    );

    expect(payload.seoTitle).toBeNull();
    expect(payload.seoDescription).toBeNull();
    expect(payload.featuredImageUrl).toBeNull();
    expect(payload.featuredImageAlt).toBeNull();
    expect(payload.heroStartAt).toBeNull();
    expect(payload.heroEndAt).toBeNull();
    expect(payload.heroPriority).toBeNull();
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
    expect(validateEditorIssues(createEditorValues({
      title: "",
      slug: "",
      excerpt: "",
      categories: "",
    }), "<p></p>")).toEqual([
      "Title required.",
      "Slug required.",
      "Summary required.",
      "Category required.",
      "Body required.",
    ]);
  });

  it("requires end date and time when hero auto-removal is enabled", () => {
    expect(getEditorFieldErrors(
      createEditorValues({
        showOnHero: true,
        heroStartMode: "scheduled",
        heroStartDate: "2026-06-26",
        heroStartTime: "11:30",
        heroEndEnabled: true,
      }),
      "<p>Lead paragraph.</p>",
    )).toMatchObject({
      heroEndDate: ["End date is required when auto-removal is enabled."],
      heroEndTime: ["End time is required when auto-removal is enabled."],
    });
  });

  it("shows a field-level error when hero end is before hero start", () => {
    expect(getEditorFieldErrors(
      createEditorValues({
        showOnHero: true,
        heroStartMode: "scheduled",
        heroStartDate: "2026-06-26",
        heroStartTime: "11:30",
        heroEndEnabled: true,
        heroEndDate: "2026-06-26",
        heroEndTime: "10:30",
      }),
      "<p>Lead paragraph.</p>",
    ).heroEndDate).toContain("Hero End must be after Hero Start.");
  });

  it("surfaces backend field errors in editor field names", () => {
    expect(extractApiFieldErrors({
      issues: {
        fieldErrors: {
          categorySlugs: ["Choose at least one category."],
          heroStartAt: ["Hero Start date is invalid."],
        },
      },
    })).toEqual({
      categories: ["Choose at least one category."],
      heroStartDate: ["Hero Start date is invalid."],
    });
  });
});

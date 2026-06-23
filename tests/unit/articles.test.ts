import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    article: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    edition: {
      findUnique: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
    siteSetting: {
      upsert: vi.fn(),
    },
  },
  enqueueScheduledPublish: vi.fn(),
  enqueueSearchIndex: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/jobs/queues", () => ({
  enqueueScheduledPublish: mocks.enqueueScheduledPublish,
  enqueueSearchIndex: mocks.enqueueSearchIndex,
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

import { enforceHeroCapacity, getArticleBySlug, updateArticle } from "@/lib/articles";

describe("article persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.article.findUnique.mockResolvedValue({
      id: "article-1",
      slug: "global-chip-alliances",
      submittedAt: null,
      approvedAt: null,
      publishedAt: null,
      versions: [{ version: 3 }],
    });
    mocks.prisma.article.findFirst.mockResolvedValue(null);
    mocks.prisma.article.findMany.mockResolvedValue([]);
    mocks.prisma.edition.findUnique.mockResolvedValue({ id: "edition-1", code: "UNITED_STATES" });
    mocks.prisma.category.findMany.mockResolvedValue([{ id: "category-1", slug: "technology" }]);
    mocks.prisma.tag.upsert.mockResolvedValue({ id: "tag-1", slug: "ai" });
    mocks.prisma.article.updateMany.mockResolvedValue({ count: 0 });
    mocks.prisma.article.update.mockImplementation(async ({ data }: { data: { featuredImageUrl?: string | null } }) => ({
      id: "article-1",
      slug: "global-chip-alliances",
      status: "PUBLISHED",
      scheduledFor: null,
      featuredImageUrl: data.featuredImageUrl ?? null,
      featuredImageAlt: data.featuredImageAlt ?? null,
      deletedAt: null,
      showOnHero: false,
      heroStartAt: null,
      heroEndAt: null,
    }));
  });

  it("writes featuredImageUrl during article update", async () => {
    const updated = await updateArticle({
      actor: { id: "user-1", role: "MANAGING_EDITOR" as never },
      articleId: "article-1",
      data: {
        title: "Global chip alliances reshape AI infrastructure competition",
        slug: "global-chip-alliances",
        dek: "",
        excerpt: "Governments and hyperscale platforms are redrawing semiconductor strategy around energy, supply chains, and sovereign cloud capacity.",
        premiumPreview: "",
        body: { type: "doc", content: [{ type: "paragraph", text: "Lead paragraph." }] },
        status: "PUBLISHED",
        accessTier: "FREE",
        articleType: "NEWS",
        editionCode: "UNITED_STATES",
        categorySlugs: ["technology"],
        tagSlugs: [],
        seoTitle: "",
        seoDescription: "",
        featured: false,
        breaking: false,
        scheduledFor: null,
        featuredImageUrl: "https://cdn.example.com/uploads/fresh-image.png",
        featuredImageAlt: "Fresh uploaded image",
        videoUrl: "",
        audioUrl: "",
        showOnHero: false,
        heroStartAt: null,
        heroEndAt: null,
        heroPriority: null,
      },
    });

    expect(updated.id).toBe("article-1");
    expect(mocks.prisma.article.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "article-1" },
      data: expect.objectContaining({
        featuredImageUrl: "https://cdn.example.com/uploads/fresh-image.png",
        featuredImageAlt: "Fresh uploaded image",
      }),
    }));
  });

  it("resolves articles by normalized slug when the incoming route slug is not canonical", async () => {
    mocks.prisma.article.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "article-1", slug: "keir-starmer-resigns" });

    const article = await getArticleBySlug("/Keir Starmer Resigns///");

    expect(article).toEqual({ id: "article-1", slug: "keir-starmer-resigns" });
    expect(mocks.prisma.article.findUnique).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { slug: "/Keir Starmer Resigns///" },
    }));
    expect(mocks.prisma.article.findUnique).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { slug: "keir-starmer-resigns" },
    }));
  });

  it("removes the oldest active hero article from hero placement when an eighth hero is enabled", async () => {
    mocks.prisma.article.findMany.mockResolvedValue([
      { id: "article-1", showOnHero: true, heroStartAt: null, heroEndAt: null, heroPriority: null, publishedAt: new Date("2026-06-20T08:00:00.000Z"), createdAt: new Date("2026-06-20T08:00:00.000Z") },
      { id: "article-2", showOnHero: true, heroStartAt: null, heroEndAt: null, heroPriority: null, publishedAt: new Date("2026-06-20T09:00:00.000Z"), createdAt: new Date("2026-06-20T09:00:00.000Z") },
      { id: "article-3", showOnHero: true, heroStartAt: null, heroEndAt: null, heroPriority: null, publishedAt: new Date("2026-06-20T10:00:00.000Z"), createdAt: new Date("2026-06-20T10:00:00.000Z") },
      { id: "article-4", showOnHero: true, heroStartAt: null, heroEndAt: null, heroPriority: null, publishedAt: new Date("2026-06-20T11:00:00.000Z"), createdAt: new Date("2026-06-20T11:00:00.000Z") },
      { id: "article-5", showOnHero: true, heroStartAt: null, heroEndAt: null, heroPriority: null, publishedAt: new Date("2026-06-20T12:00:00.000Z"), createdAt: new Date("2026-06-20T12:00:00.000Z") },
      { id: "article-6", showOnHero: true, heroStartAt: null, heroEndAt: null, heroPriority: null, publishedAt: new Date("2026-06-20T13:00:00.000Z"), createdAt: new Date("2026-06-20T13:00:00.000Z") },
      { id: "article-7", showOnHero: true, heroStartAt: null, heroEndAt: null, heroPriority: null, publishedAt: new Date("2026-06-20T14:00:00.000Z"), createdAt: new Date("2026-06-20T14:00:00.000Z") },
      { id: "article-8", showOnHero: true, heroStartAt: null, heroEndAt: null, heroPriority: null, publishedAt: new Date("2026-06-20T15:00:00.000Z"), createdAt: new Date("2026-06-20T15:00:00.000Z") },
    ]);

    await enforceHeroCapacity({
      articleId: "article-8",
      articleStatus: "PUBLISHED" as never,
      deletedAt: null,
      showOnHero: true,
      heroStartAt: null,
      heroEndAt: null,
    });

    expect(mocks.prisma.article.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["article-1"] } },
      data: { showOnHero: false },
    });
  });
});

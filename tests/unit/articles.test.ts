import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    article: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

import { updateArticle } from "@/lib/articles";

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
    mocks.prisma.edition.findUnique.mockResolvedValue({ id: "edition-1", code: "UNITED_STATES" });
    mocks.prisma.category.findMany.mockResolvedValue([{ id: "category-1", slug: "technology" }]);
    mocks.prisma.article.update.mockImplementation(async ({ data }: { data: { featuredImageUrl?: string | null } }) => ({
      id: "article-1",
      slug: "global-chip-alliances",
      status: "PUBLISHED",
      scheduledFor: null,
      featuredImageUrl: data.featuredImageUrl ?? null,
    }));
  });

  it("writes featuredImageUrl during article update", async () => {
    await updateArticle({
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
      },
    });

    expect(mocks.prisma.article.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        featuredImageUrl: "https://cdn.example.com/uploads/fresh-image.png",
        featuredImageAlt: "Fresh uploaded image",
      }),
    }));
  });
});

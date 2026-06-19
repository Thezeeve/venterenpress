import { describe, expect, it } from "vitest";
import { getNewsroomDeskLabel, selectRelatedStories, selectTrendingStories } from "@/lib/article-experience";

describe("article experience helpers", () => {
  it("maps categories to newsroom desk labels", () => {
    expect(getNewsroomDeskLabel("World / Politics")).toBe("VANTERENPRESS International Desk");
    expect(getNewsroomDeskLabel("Business / Finance")).toBe("VANTERENPRESS Business Desk");
    expect(getNewsroomDeskLabel("Technology")).toBe("VANTERENPRESS Technology Desk");
    expect(getNewsroomDeskLabel("Sports")).toBe("VANTERENPRESS Sports Desk");
    expect(getNewsroomDeskLabel("Entertainment")).toBe("VANTERENPRESS Culture Desk");
    expect(getNewsroomDeskLabel("Opinion")).toBe("VANTERENPRESS Opinion Desk");
  });

  it("selects related stories by excluding the current story and preferring category/topic overlap", () => {
    const related = selectRelatedStories(
      {
        id: "1",
        slug: "global-chip-race",
        title: "Global chip race intensifies",
        category: "Technology",
        summary: "Chipmakers and data center operators expand capacity.",
        tags: ["AI", "Semiconductors"],
      },
      [
        {
          id: "1",
          slug: "global-chip-race",
          title: "Global chip race intensifies",
          category: "Technology",
          summary: "Chipmakers and data center operators expand capacity.",
          publishedAt: "2026-06-18T00:00:00.000Z",
          tags: ["AI", "Semiconductors"],
        },
        {
          id: "2",
          slug: "nvidia-suppliers",
          title: "Nvidia suppliers scale infrastructure",
          category: "Technology",
          summary: "AI infrastructure and semiconductors remain in focus.",
          publishedAt: "2026-06-18T01:00:00.000Z",
          tags: ["AI", "Semiconductors"],
        },
        {
          id: "3",
          slug: "market-open",
          title: "Markets open mixed",
          category: "Business",
          summary: "Equity desks track inflation and rates.",
          publishedAt: "2026-06-18T02:00:00.000Z",
          tags: ["Markets"],
        },
      ],
      2,
    );

    expect(related).toHaveLength(2);
    expect(related[0]?.slug).toBe("nvidia-suppliers");
    expect(related.map((story) => story.slug)).not.toContain("global-chip-race");
  });

  it("ranks trending stories by breaking and reader-demand signals", () => {
    const trending = selectTrendingStories([
      {
        id: "1",
        slug: "older-analysis",
        title: "Older analysis",
        category: "Opinion",
        summary: "Long-form commentary.",
        publishedAt: "2026-06-15T00:00:00.000Z",
      },
      {
        id: "2",
        slug: "breaking-world",
        title: "Breaking world update",
        category: "World",
        summary: "Major developing story.",
        publishedAt: "2026-06-18T01:00:00.000Z",
        isBreaking: true,
      },
      {
        id: "3",
        slug: "most-read-tech",
        title: "Most-read tech story",
        category: "Technology",
        summary: "Readers keep returning to this report.",
        publishedAt: "2026-06-18T00:30:00.000Z",
        isMostRead: true,
      },
    ], 2);

    expect(trending).toHaveLength(2);
    expect(trending.map((story) => story.slug)).toContain("breaking-world");
    expect(trending.map((story) => story.slug)).toContain("most-read-tech");
  });
});

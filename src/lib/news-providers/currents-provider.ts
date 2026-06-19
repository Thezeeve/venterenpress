import { cleanNewsText } from "@/lib/news-providers/clean-news-text";
import { normalizeLiveStory } from "@/lib/news-providers/normalize-live-story";
import { slugify } from "@/lib/utils";
import type { EditorialStory, NewsProvider, ProviderFetchResult } from "@/lib/news-providers/types";

type CurrentsResponse = {
  news?: Array<{
    title: string;
    description: string;
    url: string;
    image?: string;
    published: string;
    category?: string[];
    author?: string;
  }>;
};

export class CurrentsNewsProvider implements NewsProvider {
  name = "currents";

  isConfigured() {
    return Boolean(process.env.CURRENTS_API_KEY);
  }

  async fetchLatest(): Promise<ProviderFetchResult> {
    const apiKey = process.env.CURRENTS_API_KEY;
    if (!apiKey) {
      return { articles: [] };
    }

    const response = await fetch("https://api.currentsapi.services/v1/latest-news?language=en", {
      headers: { Authorization: apiKey },
      next: { revalidate: 900 },
    });
    if (!response.ok) {
      return { articles: [] };
    }

    const data = (await response.json()) as CurrentsResponse;
    const articles: EditorialStory[] =
      data.news?.slice(0, 10).map((story) => {
        const title = cleanNewsText(story.title);
        const summary = cleanNewsText(story.description || story.title);

        return normalizeLiveStory({
          id: `currents-${slugify(title)}`,
          title,
          slug: slugify(title),
          category: cleanNewsText(story.category?.[0] ? story.category[0].replace(/-/g, " ") : "World"),
          edition: "United States",
          region: "Global",
          summary,
          content: [summary],
          featuredImageUrl: story.image ?? null,
          featuredImageAlt: title,
          author: { name: cleanNewsText(story.author || "Currents"), role: "Syndicated source" },
          publishedAt: story.published,
          readingTimeMinutes: 3,
          tags: [...(story.category ?? []).map((item) => cleanNewsText(item)), "Currents"],
          seoTitle: title,
          seoDescription: summary,
          sourceName: cleanNewsText("Currents API"),
          sourceUrl: story.url,
          provider: "currents",
          href: story.url,
          isExternal: true,
        });
      }) ?? [];

    return { articles };
  }
}

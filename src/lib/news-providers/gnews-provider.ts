import { cleanNewsText } from "@/lib/news-providers/clean-news-text";
import { normalizeLiveStory } from "@/lib/news-providers/normalize-live-story";
import { slugify } from "@/lib/utils";
import type { EditorialStory, NewsProvider, ProviderFetchResult } from "@/lib/news-providers/types";

type GNewsResponse = {
  articles?: Array<{
    title: string;
    description: string;
    url: string;
    image?: string;
    publishedAt: string;
    source?: { name?: string };
  }>;
};

export class GNewsProvider implements NewsProvider {
  name = "gnews";

  isConfigured() {
    return Boolean(process.env.GNEWS_API_KEY);
  }

  async fetchLatest(): Promise<ProviderFetchResult> {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      return { articles: [] };
    }

    const url =
      `https://gnews.io/api/v4/top-headlines?category=general&lang=en&max=10&apikey=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) {
      return { articles: [] };
    }

    const data = (await response.json()) as GNewsResponse;
    const articles: EditorialStory[] =
      data.articles?.map((story) => {
        const title = cleanNewsText(story.title);
        const description = cleanNewsText(story.description || story.title);

        return normalizeLiveStory({
          id: `gnews-${slugify(title)}`,
          title,
          slug: slugify(title),
          category: "World",
          edition: "United States",
          region: "Global",
          summary: description,
          content: [description],
          featuredImageUrl: story.image ?? null,
          featuredImageAlt: title,
          author: { name: cleanNewsText(story.source?.name ?? "GNews"), role: "Syndicated source" },
          publishedAt: story.publishedAt,
          readingTimeMinutes: 3,
          tags: ["Top Headlines", "GNews"],
          seoTitle: title,
          seoDescription: description,
          sourceName: cleanNewsText(story.source?.name ?? "GNews"),
          sourceUrl: story.url,
          provider: "gnews",
          href: story.url,
          isExternal: true,
        });
      }) ?? [];

    return { articles };
  }
}

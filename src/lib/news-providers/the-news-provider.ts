import { cleanNewsText } from "@/lib/news-providers/clean-news-text";
import { normalizeLiveStory } from "@/lib/news-providers/normalize-live-story";
import { slugify } from "@/lib/utils";
import type { EditorialStory, NewsProvider, ProviderFetchResult } from "@/lib/news-providers/types";

type TheNewsApiResponse = {
  data?: Array<{
    title: string;
    description?: string;
    url: string;
    image_url?: string;
    published_at: string;
    categories?: string[];
    source?: string;
  }>;
};

export class TheNewsApiProvider implements NewsProvider {
  name = "the-news-api";

  isConfigured() {
    return Boolean(process.env.THENEWSAPI_API_TOKEN);
  }

  async fetchLatest(): Promise<ProviderFetchResult> {
    const apiToken = process.env.THENEWSAPI_API_TOKEN;
    if (!apiToken) {
      return { articles: [] };
    }

    const url =
      `https://api.thenewsapi.com/v1/news/top?api_token=${encodeURIComponent(apiToken)}` +
      "&locale=us,gb&language=en&limit=10";
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) {
      return { articles: [] };
    }

    const data = (await response.json()) as TheNewsApiResponse;
    const articles: EditorialStory[] =
      data.data?.map((story) => {
        const title = cleanNewsText(story.title);
        const summary = cleanNewsText(story.description || story.title);

        return normalizeLiveStory({
          id: `thenews-${slugify(title)}`,
          title,
          slug: slugify(title),
          category: cleanNewsText(story.categories?.[0] ? story.categories[0].replace(/_/g, " ") : "World"),
          edition: "United States",
          region: "Global",
          summary,
          content: [summary],
          featuredImageUrl: story.image_url ?? null,
          featuredImageAlt: title,
          author: { name: cleanNewsText(story.source || "The News API"), role: "Syndicated source" },
          publishedAt: story.published_at,
          readingTimeMinutes: 3,
          tags: [...(story.categories ?? []).map((item) => cleanNewsText(item)), "TheNewsAPI"],
          seoTitle: title,
          seoDescription: summary,
          sourceName: cleanNewsText(story.source || "The News API"),
          sourceUrl: story.url,
          provider: "the-news-api",
          href: story.url,
          isExternal: true,
        });
      }) ?? [];

    return { articles };
  }
}

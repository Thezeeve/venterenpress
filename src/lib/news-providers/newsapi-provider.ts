import { cleanNewsContent, cleanNewsText } from "@/lib/news-providers/clean-news-text";
import { normalizeLiveStory } from "@/lib/news-providers/normalize-live-story";
import { slugify } from "@/lib/utils";
import type { EditorialStory, NewsProvider, ProviderFetchResult } from "@/lib/news-providers/types";

type NewsApiResponse = {
  articles?: Array<{
    title: string;
    description?: string | null;
    content?: string | null;
    url: string;
    urlToImage?: string | null;
    publishedAt: string;
    source?: { name?: string | null };
  }>;
};

function inferCategory(title: string, summary: string, content: string[]) {
  const haystack = `${title} ${summary} ${content.join(" ")}`.toLowerCase();

  if (/(ai|chip|technology|cyber|data center|software|nvidia|infrastructure)/.test(haystack)) {
    return "Technology";
  }
  if (/(market|economy|business|oil|finance|inflation|central bank|stocks)/.test(haystack)) {
    return "Business";
  }
  if (/(world cup|sports|football|soccer|brazil|spain|fifa)/.test(haystack)) {
    return "Sports";
  }

  return "World";
}

export class NewsApiProvider implements NewsProvider {
  name = "newsapi";

  isConfigured() {
    return Boolean(process.env.NEWS_API_KEY);
  }

  async fetchLatest(): Promise<ProviderFetchResult> {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return { articles: [] };
    }

    const url = new URL("https://newsapi.org/v2/top-headlines");
    url.searchParams.set("language", "en");
    url.searchParams.set("pageSize", "12");
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url.toString(), { next: { revalidate: 900 } });
    if (!response.ok) {
      return { articles: [] };
    }

    const data = (await response.json()) as NewsApiResponse;
    const articles: EditorialStory[] =
      data.articles?.map((story) => {
        const title = cleanNewsText(story.title);
        const summary = cleanNewsText(story.description || story.title);
        const content = cleanNewsContent(story.content ? [story.content] : [summary]);
        const category = inferCategory(title, summary, content);

        return normalizeLiveStory({
          id: `newsapi-${slugify(title)}`,
          title,
          slug: slugify(title),
          category,
          edition: "Global",
          region: "Global",
          summary,
          content,
          featuredImageUrl: story.urlToImage ?? null,
          featuredImageAlt: title,
          author: { name: cleanNewsText(story.source?.name ?? "NewsAPI"), role: "Syndicated source" },
          publishedAt: story.publishedAt,
          readingTimeMinutes: 3,
          tags: [category, "NewsAPI"],
          seoTitle: title,
          seoDescription: summary,
          sourceName: cleanNewsText(story.source?.name ?? "NewsAPI"),
          sourceUrl: story.url,
          provider: "newsapi",
          storySourceType: "live",
          href: story.url,
          isExternal: true,
        });
      }) ?? [];

    return { articles };
  }
}

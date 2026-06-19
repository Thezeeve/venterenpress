import { cleanNewsText } from "@/lib/news-providers/clean-news-text";
import { normalizeLiveStory } from "@/lib/news-providers/normalize-live-story";
import { slugify } from "@/lib/utils";
import type { EditorialStory, NewsProvider, ProviderFetchResult } from "@/lib/news-providers/types";

type GuardianResponse = {
  response?: {
    results?: Array<{
      webTitle: string;
      webUrl: string;
      webPublicationDate: string;
      sectionName: string;
      fields?: {
        trailText?: string;
        thumbnail?: string;
      };
    }>;
  };
};

export class GuardianNewsProvider implements NewsProvider {
  name = "guardian";

  isConfigured() {
    return Boolean(process.env.GUARDIAN_OPEN_PLATFORM_KEY);
  }

  async fetchLatest(): Promise<ProviderFetchResult> {
    const apiKey = process.env.GUARDIAN_OPEN_PLATFORM_KEY;
    if (!apiKey) {
      return { articles: [] };
    }

    const url =
      `https://content.guardianapis.com/search?api-key=${encodeURIComponent(apiKey)}` +
      "&section=world|business|technology&page-size=9&show-fields=trailText,thumbnail&order-by=newest";
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) {
      return { articles: [] };
    }

    const data = (await response.json()) as GuardianResponse;
    const articles: EditorialStory[] =
      data.response?.results?.map((story) => {
        const title = cleanNewsText(story.webTitle);
        const summary = cleanNewsText(story.fields?.trailText ?? story.webTitle);

        return normalizeLiveStory({
          id: `guardian-${slugify(title)}`,
          title,
          slug: slugify(title),
          category: cleanNewsText(story.sectionName),
          edition: "United Kingdom",
          region: "Global",
          summary,
          content: [summary],
          featuredImageUrl: story.fields?.thumbnail ?? null,
          featuredImageAlt: title,
          author: { name: "The Guardian", role: "Syndicated source" },
          publishedAt: story.webPublicationDate,
          readingTimeMinutes: 4,
          tags: [cleanNewsText(story.sectionName), "Guardian"],
          seoTitle: title,
          seoDescription: summary,
          sourceName: "The Guardian Open Platform",
          sourceUrl: story.webUrl,
          provider: "guardian",
          href: story.webUrl,
          isExternal: true,
        });
      }) ?? [];

    return { articles };
  }
}

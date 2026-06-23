import { cleanNewsContent, cleanNewsText } from "@/lib/news-providers/clean-news-text";
import { normalizeLiveStory } from "@/lib/news-providers/normalize-live-story";
import { slugify } from "@/lib/utils";
import type { EditorialStory, NewsProvider, ProviderFetchResult } from "@/lib/news-providers/types";

type RssFeedConfig = {
  url: string;
  category: string;
  edition: string;
  region: string;
  sourceName: string;
};

const defaultFeeds: RssFeedConfig[] = [
  {
    url: process.env.RSS_WORLD_FEED_URL ?? "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "World",
    edition: "United Kingdom",
    region: "Global",
    sourceName: "BBC RSS",
  },
  {
    url: process.env.RSS_BUSINESS_FEED_URL ?? "https://feeds.bbci.co.uk/news/business/rss.xml",
    category: "Business",
    edition: "United Kingdom",
    region: "Global",
    sourceName: "BBC RSS",
  },
  {
    url: process.env.RSS_TECH_FEED_URL ?? "https://techcrunch.com/feed/",
    category: "Technology",
    edition: "United States",
    region: "Global",
    sourceName: "TechCrunch RSS",
  },
];

function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? cleanNewsText(match[1].trim()) : "";
}

function buildRssStory(item: string, feed: RssFeedConfig): EditorialStory | null {
  const title = extractTag(item, "title");
  const link = extractTag(item, "link");
  const description = extractTag(item, "description");
  const publishedAt = extractTag(item, "pubDate");
  const imageMatch = item.match(/(?:media:content|enclosure)[^>]+url="([^"]+)"/i);

  if (!title || !link) {
    return null;
  }

  const summary = cleanNewsText(description).slice(0, 220) || title;
  const content = cleanNewsContent([description, title]);

  return normalizeLiveStory({
    id: `rss-${slugify(title)}`,
    title: cleanNewsText(title),
    slug: slugify(title),
    category: cleanNewsText(feed.category),
    edition: feed.edition,
    region: feed.region,
    summary,
    content: content.length ? content : [summary],
    featuredImageUrl: imageMatch?.[1] ?? null,
    featuredImageAlt: cleanNewsText(title),
    author: { name: cleanNewsText(feed.sourceName), role: "Syndicated source" },
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
    readingTimeMinutes: 3,
    tags: [feed.category, "RSS"],
    seoTitle: cleanNewsText(title),
    seoDescription: summary.slice(0, 160) || cleanNewsText(title),
    sourceName: cleanNewsText(feed.sourceName),
    sourceUrl: link,
    provider: "rss",
    storySourceType: "live",
    href: link,
    isExternal: true,
  });
}

export class RssNewsProvider implements NewsProvider {
  name = "rss";

  isConfigured() {
    return process.env.ENABLE_RSS_NEWS !== "false" && defaultFeeds.length > 0;
  }

  async fetchLatest(): Promise<ProviderFetchResult> {
    const responses = await Promise.allSettled(
      defaultFeeds.map(async (feed) => {
        const response = await fetch(feed.url, { next: { revalidate: 900 } });
        if (!response.ok) {
          throw new Error(`RSS fetch failed: ${feed.url}`);
        }

        const xml = await response.text();
        const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)]
          .slice(0, 4)
          .map((match) => buildRssStory(match[0], feed))
          .filter((story): story is EditorialStory => Boolean(story));

        return items;
      }),
    );

    return {
      articles: responses.flatMap((item) => (item.status === "fulfilled" ? item.value : [])),
    };
  }
}

import type { Prisma } from "@prisma/client";
import { resolveArticleImage } from "@/lib/article-rendering";
import type { EditorialStory, HomepageNewsBundle } from "@/lib/news-providers/types";
import { siteConfig } from "@/lib/site";

export const HOMEPAGE_HERO_ARTICLE_KEY = "homepage.heroArticleId";
export const HOMEPAGE_HERO_MAX_ITEMS = 7;

type HomepageHeroArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: Prisma.JsonValue;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  media?: Array<{ url: string; thumbnailUrl: string | null; altText: string | null }>;
  publishedAt: Date | null;
  updatedAt: Date;
  readingTimeMinutes: number;
  articleType: string;
  author: {
    name: string | null;
    email: string | null;
  };
  edition: {
    name: string;
    region: string;
  };
  categories: Array<{ category: { name: string } }>;
  tags: Array<{ tag: { name: string } }>;
  showOnHero?: boolean;
  heroStartAt?: Date | null;
  heroEndAt?: Date | null;
  heroPriority?: number | null;
};

export function isHeroWindowActive(article: {
  showOnHero?: boolean | null;
  heroStartAt?: Date | string | null;
  heroEndAt?: Date | string | null;
}, now = new Date()) {
  if (!article.showOnHero) {
    return false;
  }

  const startAt = article.heroStartAt ? new Date(article.heroStartAt) : null;
  const endAt = article.heroEndAt ? new Date(article.heroEndAt) : null;

  if (startAt && startAt.getTime() > now.getTime()) {
    return false;
  }

  if (endAt && endAt.getTime() <= now.getTime()) {
    return false;
  }

  return true;
}

export function selectActiveHomepageHeroArticles<T extends {
  showOnHero?: boolean | null;
  heroStartAt?: Date | string | null;
  heroEndAt?: Date | string | null;
}>(articles: readonly T[], now = new Date()) {
  return articles.filter((article) => isHeroWindowActive(article, now)).slice(0, HOMEPAGE_HERO_MAX_ITEMS);
}

function isSameStory(left: Pick<EditorialStory, "id" | "slug" | "href">, right: Pick<EditorialStory, "id" | "slug" | "href">) {
  return left.id === right.id || left.slug === right.slug || left.href === right.href;
}

function summarizeBody(body: Prisma.JsonValue) {
  if (!body || typeof body !== "object" || !("content" in body) || !Array.isArray(body.content)) {
    return [];
  }

  return body.content
    .map((node) => {
      if (!node || typeof node !== "object") {
        return null;
      }

      if ("text" in node && typeof node.text === "string" && node.text.trim()) {
        return node.text.trim();
      }

      if ("items" in node && Array.isArray(node.items)) {
        return node.items.map((item) => String(item).trim()).filter(Boolean).join(" ");
      }

      return null;
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
}

export function toEditorialStoryFromArticle(article: HomepageHeroArticle): EditorialStory {
  const category = article.categories[0]?.category.name ?? article.articleType;
  const summary = article.excerpt?.trim() || article.title;
  const content = summarizeBody(article.body);
  const image = resolveArticleImage({
    slug: article.slug,
    category,
    title: article.title,
    summary,
    featuredImageUrl: article.featuredImageUrl,
    featuredImageAlt: article.featuredImageAlt,
    media: article.media,
  });

  return {
    id: article.id,
    slug: article.slug,
    href: `/articles/${article.slug}`,
    title: article.title,
    category,
    edition: article.edition.name,
    region: article.edition.region,
    summary,
    content: content.length ? content : [summary],
    featuredImageUrl: image.imageUrl,
    featuredImageAlt: image.imageAlt ?? article.title,
    author: {
      name: article.author.name ?? article.author.email ?? siteConfig.name,
      role: `${siteConfig.name} newsroom`,
    },
    publishedAt: (article.publishedAt ?? article.updatedAt).toISOString(),
    readingTimeMinutes: article.readingTimeMinutes,
    tags: article.tags.map((item) => item.tag.name),
    seoTitle: article.title,
    seoDescription: summary,
    sourceName: siteConfig.name,
    sourceUrl: null,
    provider: "cms",
    isExternal: false,
    isBreaking: false,
    isOpinion: article.articleType === "OPINION" || article.articleType === "EDITORIAL",
    isLive: article.articleType === "LIVE_BLOG",
    isMostRead: false,
  };
}

export function applyHomepageHeroSelection(
  bundle: HomepageNewsBundle,
  manualHero: EditorialStory | null,
  fallbackHero: EditorialStory | null,
  heroCarouselStories: EditorialStory[] = [],
) {
  const heroStory = manualHero ?? fallbackHero ?? bundle.heroStory;
  const seen = new Set<string>();
  const mergedTopStories = [
    ...heroCarouselStories,
    ...bundle.topStories,
  ].filter((story) => {
    if (isSameStory(story, heroStory)) {
      return false;
    }

    const key = story.id || story.href || story.slug;
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return {
    ...bundle,
    heroStory,
    topStories: mergedTopStories,
  } satisfies HomepageNewsBundle;
}

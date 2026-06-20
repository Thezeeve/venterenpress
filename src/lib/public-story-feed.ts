import { isDatabaseAvailable } from "@/lib/database-availability";
import { resolveArticleHeroImage } from "@/lib/article-rendering";
import { getHomepageNewsResponse } from "@/lib/news-providers";
import type { EditorialStory, HomepageNewsBundle } from "@/lib/news-providers/types";
import type { NewsroomArticleCard } from "@/lib/newsroom";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export type PublicStoryFeedItem = {
  id: string;
  slug: string;
  href: string;
  title: string;
  excerpt: string | null;
  category: string;
  publishedAt: Date | string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  region?: string | null;
};

export type PublicNavItem = {
  label: string;
  href: string;
};

export const PUBLIC_CATEGORY_CONFIG = {
  world: { label: "World", href: "/world", section: "world" },
  business: { label: "Business", href: "/business", section: "business" },
  technology: { label: "Technology", href: "/technology", section: "technology" },
  finance: { label: "Finance", href: "/finance", section: "finance" },
  sports: { label: "Sports", href: "/sports", section: "sports" },
  entertainment: { label: "Entertainment", href: "/entertainment", section: "entertainment" },
  opinion: { label: "Opinion", href: "/opinion", section: "opinion" },
} as const;

export const PUBLIC_TOPIC_CONFIG = {
  politics: { label: "Politics", href: "/politics" },
  crypto: { label: "Crypto", href: "/crypto" },
} as const;

const PUBLIC_NAV_ORDER = [
  { type: "category", key: "world" },
  { type: "topic", key: "politics" },
  { type: "category", key: "business" },
  { type: "category", key: "technology" },
  { type: "topic", key: "crypto" },
  { type: "category", key: "opinion" },
  { type: "category", key: "finance" },
  { type: "category", key: "sports" },
  { type: "category", key: "entertainment" },
] as const;

function normalizeExactLabel(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function matchesExactCategory(category: string | null | undefined, expected: string) {
  return normalizeExactLabel(category) === normalizeExactLabel(expected);
}

function hasExactTag(tags: readonly string[] | undefined, expected: string) {
  return (tags ?? []).some((tag) => normalizeExactLabel(tag) === normalizeExactLabel(expected));
}

export function dedupePublicStoryImages<T extends { imageUrl?: string | null }>(stories: readonly T[]) {
  const usedImages = new Set<string>();

  return stories.map((story) => {
    const imageUrl = story.imageUrl ?? null;
    if (!imageUrl || usedImages.has(imageUrl)) {
      return {
        ...story,
        imageUrl: null,
      };
    }

    usedImages.add(imageUrl);
    return story;
  });
}

export function formatPublicStoryDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Latest coverage";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function flattenHomepageStories(bundle: HomepageNewsBundle) {
  const seen = new Set<string>();
  return [
    bundle.heroStory,
    ...bundle.topStories,
    ...bundle.worldNews,
    ...bundle.businessNews,
    ...bundle.technologyNews,
    ...bundle.sportsNews,
    ...bundle.liveCoverage,
    ...bundle.opinion,
    ...bundle.mostRead,
  ].filter((story) => {
    const key = story.sourceUrl ?? story.slug;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function filterExactSectionEditorialStories(stories: readonly EditorialStory[], section: keyof typeof PUBLIC_CATEGORY_CONFIG) {
  const expected = PUBLIC_CATEGORY_CONFIG[section].label;

  return stories.filter((story) => {
    if (section === "finance") {
      return matchesExactCategory(story.category, expected) || hasExactTag(story.tags, expected);
    }

    return matchesExactCategory(story.category, expected);
  });
}

function filterExactTopicEditorialStories(stories: readonly EditorialStory[], topicSlug: keyof typeof PUBLIC_TOPIC_CONFIG) {
  const expected = PUBLIC_TOPIC_CONFIG[topicSlug].label;

  return stories.filter((story) => matchesExactCategory(story.category, expected) || hasExactTag(story.tags, expected));
}

function resolveStoryImage(input: {
  slug: string;
  category: string;
  title: string;
  summary: string;
  featuredImageUrl?: string | null;
  imageUrl?: string | null;
}) {
  return resolveArticleHeroImage(input);
}

type PublicArticleSource = Pick<NewsroomArticleCard, "id" | "slug" | "title" | "excerpt" | "articleType" | "publishedAt" | "edition" | "categories"> & {
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
};

export function toPublicStoryFromArticle(article: PublicArticleSource): PublicStoryFeedItem {
  return {
    id: article.id,
    slug: article.slug,
    href: `/articles/${article.slug}`,
    title: article.title,
    excerpt: article.excerpt,
    category: article.categories[0]?.category.name ?? article.articleType,
    publishedAt: article.publishedAt,
    imageUrl: resolveStoryImage({
      slug: article.slug,
      category: article.categories[0]?.category.name ?? article.articleType,
      title: article.title,
      summary: article.excerpt ?? "",
      featuredImageUrl: article.featuredImageUrl,
    }),
    imageAlt: article.featuredImageAlt ?? article.title,
    region: article.edition.region,
  };
}

export function toPublicStoryFromEditorial(story: EditorialStory): PublicStoryFeedItem {
  return {
    id: story.id,
    slug: story.slug,
    href: `/articles/${story.slug}`,
    title: story.title,
    excerpt: story.summary,
    category: story.category,
    publishedAt: story.publishedAt,
    imageUrl: resolveStoryImage({
      slug: story.slug,
      category: story.category,
      title: story.title,
      summary: story.summary,
      featuredImageUrl: story.featuredImageUrl,
    }),
    imageAlt: story.featuredImageAlt ?? story.title,
    region: story.region,
  };
}

export async function getHomepageFallbackStories() {
  const response = await getHomepageNewsResponse();
  return flattenHomepageStories(response.bundle);
}

export async function getCategoryStories(slug: string) {
  if (!await isDatabaseAvailable()) {
    const stories = await getHomepageFallbackStories();
    return stories
      .filter((story) => slugify(story.category) === slug)
      .map(toPublicStoryFromEditorial);
  }

  try {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      return null;
    }

    const articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        categories: { some: { categoryId: category.id } },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            isVerifiedJournalist: true,
          },
        },
        edition: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 18,
    });

    return articles.map(toPublicStoryFromArticle);
  } catch {
    const stories = await getHomepageFallbackStories();
    return stories
      .filter((story) => slugify(story.category) === slug)
      .map(toPublicStoryFromEditorial);
  }
}

export async function getSectionStories(section: keyof typeof PUBLIC_CATEGORY_CONFIG) {
  if (!await isDatabaseAvailable()) {
    const stories = await getHomepageFallbackStories();
    return filterExactSectionEditorialStories(stories, section).slice(0, 18).map(toPublicStoryFromEditorial);
  }

  try {
    const expected = PUBLIC_CATEGORY_CONFIG[section].label;
    const articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        OR: section === "finance"
          ? [
              { categories: { some: { category: { name: expected } } } },
              { tags: { some: { tag: { name: expected } } } },
            ]
          : [{ categories: { some: { category: { name: expected } } } }],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            isVerifiedJournalist: true,
          },
        },
        edition: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 18,
    });

    return articles
      .filter((article) => {
        if (section === "finance") {
          return article.categories.some((item) => matchesExactCategory(item.category.name, expected))
            || article.tags.some((item) => matchesExactCategory(item.tag.name, expected));
        }

        return article.categories.some((item) => matchesExactCategory(item.category.name, expected));
      })
      .map(toPublicStoryFromArticle);
  } catch {
    const stories = await getHomepageFallbackStories();
    return filterExactSectionEditorialStories(stories, section).slice(0, 18).map(toPublicStoryFromEditorial);
  }
}

export async function getTopicStories(slug: string) {
  if (!(slug in PUBLIC_TOPIC_CONFIG)) {
    return null;
  }

  const topicSlug = slug as keyof typeof PUBLIC_TOPIC_CONFIG;

  if (!await isDatabaseAvailable()) {
    const stories = await getHomepageFallbackStories();
    return filterExactTopicEditorialStories(stories, topicSlug).slice(0, 18).map(toPublicStoryFromEditorial);
  }

  try {
    const expected = PUBLIC_TOPIC_CONFIG[topicSlug].label;
    const articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        OR: [
          { categories: { some: { category: { name: expected } } } },
          { tags: { some: { tag: { name: expected } } } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            isVerifiedJournalist: true,
          },
        },
        edition: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 18,
    });

    return articles
      .filter((article) =>
        article.categories.some((item) => matchesExactCategory(item.category.name, expected))
        || article.tags.some((item) => matchesExactCategory(item.tag.name, expected)))
      .map(toPublicStoryFromArticle);
  } catch {
    const stories = await getHomepageFallbackStories();
    return filterExactTopicEditorialStories(stories, topicSlug).slice(0, 18).map(toPublicStoryFromEditorial);
  }
}

export async function getVisiblePublicNavItems() {
  if (!await isDatabaseAvailable()) {
    const stories = await getHomepageFallbackStories();
    const navItems: PublicNavItem[] = [{ label: "Home", href: "/" }];

    PUBLIC_NAV_ORDER.forEach((entry) => {
      if (entry.type === "category") {
        const config = PUBLIC_CATEGORY_CONFIG[entry.key];
        if (filterExactSectionEditorialStories(stories, entry.key).length > 0) {
          navItems.push({ label: config.label, href: config.href });
        }
        return;
      }

      const config = PUBLIC_TOPIC_CONFIG[entry.key];
      if (filterExactTopicEditorialStories(stories, entry.key).length > 0) {
        navItems.push({ label: config.label, href: config.href });
      }
    });

    return navItems;
  }

  try {
    const [categories, financeCount, politicsCount, cryptoCount] = await Promise.all([
      prisma.category.findMany({
        where: {
          OR: Object.values(PUBLIC_CATEGORY_CONFIG)
            .filter((config) => config.section !== "finance")
            .map((config) => ({ name: config.label })),
          articles: {
            some: {
              article: {
                status: "PUBLISHED",
                deletedAt: null,
              },
            },
          },
        },
        select: { name: true },
      }),
      prisma.article.count({
        where: {
          status: "PUBLISHED",
          deletedAt: null,
          OR: [
            { categories: { some: { category: { name: PUBLIC_CATEGORY_CONFIG.finance.label } } } },
            { tags: { some: { tag: { name: PUBLIC_CATEGORY_CONFIG.finance.label } } } },
          ],
        },
      }),
      prisma.article.count({
        where: {
          status: "PUBLISHED",
          deletedAt: null,
          OR: [
            { categories: { some: { category: { name: PUBLIC_TOPIC_CONFIG.politics.label } } } },
            { tags: { some: { tag: { name: PUBLIC_TOPIC_CONFIG.politics.label } } } },
          ],
        },
      }),
      prisma.article.count({
        where: {
          status: "PUBLISHED",
          deletedAt: null,
          OR: [
            { categories: { some: { category: { name: PUBLIC_TOPIC_CONFIG.crypto.label } } } },
            { tags: { some: { tag: { name: PUBLIC_TOPIC_CONFIG.crypto.label } } } },
          ],
        },
      }),
    ]);

    const visibleCategoryNames = new Set(categories.map((item) => item.name));
    const navItems: PublicNavItem[] = [{ label: "Home", href: "/" }];

    PUBLIC_NAV_ORDER.forEach((entry) => {
      if (entry.type === "category") {
        const config = PUBLIC_CATEGORY_CONFIG[entry.key];
        if (config.section === "finance" ? financeCount > 0 : visibleCategoryNames.has(config.label)) {
          navItems.push({ label: config.label, href: config.href });
        }
        return;
      }

      if (entry.key === "politics" && politicsCount > 0) {
        navItems.push(PUBLIC_TOPIC_CONFIG.politics);
      }

      if (entry.key === "crypto" && cryptoCount > 0) {
        navItems.push(PUBLIC_TOPIC_CONFIG.crypto);
      }
    });

    return navItems;
  } catch {
    const stories = await getHomepageFallbackStories();
    const navItems: PublicNavItem[] = [{ label: "Home", href: "/" }];

    PUBLIC_NAV_ORDER.forEach((entry) => {
      if (entry.type === "category") {
        const config = PUBLIC_CATEGORY_CONFIG[entry.key];
        if (filterExactSectionEditorialStories(stories, entry.key).length > 0) {
          navItems.push({ label: config.label, href: config.href });
        }
        return;
      }

      const config = PUBLIC_TOPIC_CONFIG[entry.key];
      if (filterExactTopicEditorialStories(stories, entry.key).length > 0) {
        navItems.push({ label: config.label, href: config.href });
      }
    });

    return navItems;
  }
}

export async function getRegionSummaries() {
  const stories = await getHomepageFallbackStories();
  const groups = new Map<string, PublicStoryFeedItem[]>();

  stories.forEach((story) => {
    const key = story.region || "Global";
    const current = groups.get(key) ?? [];
    current.push(toPublicStoryFromEditorial(story));
    groups.set(key, current);
  });

  return [...groups.entries()]
    .map(([region, items]) => ({
      region,
      slug: region.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      count: items.length,
      lead: items[0] ?? null,
    }))
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count);
}

export async function getRegionStories(slug: string) {
  const stories = await getHomepageFallbackStories();
  return stories
    .filter((story) => story.region.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug)
    .slice(0, 18)
    .map(toPublicStoryFromEditorial);
}

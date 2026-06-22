import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NewsroomArticleCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status?: string | null;
  deletedAt?: Date | null;
  featuredImage?: string | { url?: string | null; altText?: string | null } | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  image?: string | { url?: string | null; altText?: string | null } | null;
  imageUrl?: string | null;
  coverImage?: string | { url?: string | null; altText?: string | null } | null;
  thumbnail?: string | { url?: string | null; altText?: string | null } | null;
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
  media?: { url?: string | null; thumbnailUrl?: string | null; altText?: string | null }[] | null;
  articleType: string;
  accessTier: string;
  readingTimeMinutes: number;
  publishedAt: Date | null;
  edition: { id: string; name: string; code: string; region: string };
  author: {
    id: string;
    name: string | null;
    email: string | null;
    bio: string | null;
    isVerifiedJournalist: boolean;
  };
  categories: { category: { id: string; slug: string; name: string } }[];
  tags: { tag: { id: string; slug: string; name: string } }[];
};

export type PersonalizationContext = {
  savedCategorySlugs: string[];
  followedAuthorIds: string[];
  historyCategorySlugs: string[];
  historyArticleIds: string[];
  favoriteEditionIds: string[];
};

export type NewsroomEdition = {
  id: string;
  code: string;
  name: string;
  region: string;
};

export type NewsroomNotification = {
  id: string;
  title: string;
  body: string;
  readAt: Date | string | null;
};

export type MegaMenuGroup = {
  title: string;
  description: string;
  links: { label: string; href: string }[];
};

export type ArticleTrustMeta = {
  factCheckLabel: string;
  factCheckTone: "verified" | "in-progress" | "watch";
  reviewLabel: string;
  reviewStatus: string;
  correctionLabel: string;
  storyMatters: string[];
};

export const newsroomArticleInclude = {
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
  media: {
    select: {
      url: true,
      thumbnailUrl: true,
      altText: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

export const publicRouteCatalog = [
  "/",
  "/latest",
  "/most-read",
  "/topics",
  "/tags",
  "/categories",
  "/regions",
  "/video",
  "/live",
  "/rss",
  "/pricing",
  "/subscribe",
] as const;

export function getMegaMenuGroups(categories: { name: string; slug: string }[], editions: NewsroomEdition[]): MegaMenuGroup[] {
  return [
    {
      title: "Sections",
      description: "Navigate by desk, newsroom priorities, and high-frequency coverage lanes.",
      links: categories.slice(0, 8).map((category) => ({
        label: category.name,
        href: `/categories/${category.slug}`,
      })),
    },
    {
      title: "Editions",
      description: "Move directly into regional homepages and edition-led reporting.",
      links: editions.map((edition) => ({
        label: edition.name,
        href: `/regions/${editionCodeToSlug(edition.code)}`,
      })),
    },
    {
      title: "Products",
      description: "Reader journeys across live, video, opinion, newsletters, and subscriptions.",
      links: [
        { label: "Latest news", href: "/latest" },
        { label: "Most read", href: "/most-read" },
        { label: "Live", href: "/live" },
        { label: "Video", href: "/video" },
        { label: "Opinion", href: "/search?articleType=OPINION" },
        { label: "Newsletters", href: "/account/newsletters" },
        { label: "Subscription", href: "/pricing" },
      ],
    },
  ];
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function slugifyValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function editionCodeToSlug(code: string) {
  return code.toLowerCase().replace(/_/g, "-");
}

export function editionSlugToLabel(slug: string) {
  return titleCase(slug);
}

export function formatRouteLabel(slug: string) {
  return titleCase(slug);
}

export function buildArticleSummary(article: NewsroomArticleCard) {
  return `${article.edition.name} | ${article.categories[0]?.category.name ?? article.articleType}`;
}

export function parsePreferencesRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function summarizeNewsletterPreferences(value: unknown) {
  const preferences = parsePreferencesRecord(value);
  const topics = Array.isArray(preferences.topics) ? preferences.topics.map(String) : [];
  const regions = Array.isArray(preferences.regions) ? preferences.regions.map(String) : [];
  const cadence = typeof preferences.cadence === "string" ? preferences.cadence : "Daily";

  return {
    topics,
    regions,
    cadence,
    hasPreferences: topics.length > 0 || regions.length > 0 || Object.keys(preferences).length > 0,
  };
}

export function summarizeNotificationPreferences(value: unknown) {
  const preferences = parsePreferencesRecord(value);
  return {
    email: preferences.email !== false,
    push: preferences.push === true,
    breakingNews: preferences.breakingNews !== false,
    newsletters: preferences.newsletters !== false,
    comments: preferences.comments !== false,
  };
}

export function buildArticleTrustMeta(input: {
  reviewStepDecision?: string | null;
  articleStatus: string;
  editionName: string;
  hasCorrections: boolean;
  citationCount: number;
  primaryCategory?: string | null;
}) {
  const decision = input.reviewStepDecision ?? "";
  const factCheckLabel =
    decision === "APPROVED" && input.citationCount >= 2
      ? "Fact-check verified"
      : input.articleStatus === "FACT_CHECKING"
        ? "Fact-check in progress"
        : input.citationCount > 0
          ? "Source-backed reporting"
          : "Verification watch";
  const factCheckTone =
    factCheckLabel === "Fact-check verified"
      ? "verified"
      : factCheckLabel === "Fact-check in progress"
        ? "in-progress"
        : "watch";
  const reviewStatus =
    decision === "APPROVED"
      ? "Approved by editorial review"
      : decision === "CHANGES_REQUESTED"
        ? "Returned for editorial changes"
        : decision === "REJECTED"
          ? "Rejected in review"
          : input.articleStatus === "EDITOR_REVIEW"
            ? "Editor review in progress"
            : "Published with newsroom review trail";
  const correctionLabel = input.hasCorrections ? "Correction history available" : "No public corrections logged";

  return {
    factCheckLabel,
    factCheckTone,
    reviewLabel: reviewStatus,
    reviewStatus,
    correctionLabel,
    storyMatters: [
      `Published through the ${input.editionName} edition with region-aware context and distribution.`,
      `Readers following ${input.primaryCategory ?? "this topic"} can track developments, source notes, and related reporting in one place.`,
      input.hasCorrections
        ? "Any post-publication updates are surfaced publicly to preserve accountability."
        : "The newsroom is surfacing verification and sourcing context alongside the article for reader trust.",
    ],
  } satisfies ArticleTrustMeta;
}

export function buildShareLinks(article: Pick<NewsroomArticleCard, "slug" | "title">, siteUrl: string) {
  const url = `${siteUrl}/articles/${article.slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(article.title);

  return [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];
}

export function scoreRecommendedArticle(article: NewsroomArticleCard, context: PersonalizationContext) {
  let score = 0;

  const categorySlugs = article.categories.map((item) => item.category.slug);

  if (context.followedAuthorIds.includes(article.author.id)) {
    score += 8;
  }

  if (categorySlugs.some((slug) => context.savedCategorySlugs.includes(slug))) {
    score += 6;
  }

  if (categorySlugs.some((slug) => context.historyCategorySlugs.includes(slug))) {
    score += 4;
  }

  if (context.favoriteEditionIds.includes(article.edition.id)) {
    score += 3;
  }

  if (article.accessTier !== "FREE") {
    score += 1;
  }

  const ageInHours = article.publishedAt
    ? (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60)
    : 72;
  score += Math.max(0, 12 - ageInHours / 8);

  return score;
}

export function rankRecommendedArticles(articles: NewsroomArticleCard[], context: PersonalizationContext) {
  return [...articles]
    .filter((article) => !context.historyArticleIds.includes(article.id))
    .sort((left, right) => scoreRecommendedArticle(right, context) - scoreRecommendedArticle(left, context));
}

export async function getPersonalizedNewsroom(userId: string | null | undefined) {
  if (!userId) {
    return null;
  }

  const [profile, bookmarks, follows, accessEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { newsletterPreferences: true, notificationPreferences: true },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            categories: { include: { category: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { journalistId: true },
    }),
    prisma.readerAccessEvent.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            edition: true,
            author: true,
            categories: { include: { category: true } },
            tags: { include: { tag: true } },
          },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: 12,
    }),
  ]);

  const savedCategorySlugs = bookmarks.flatMap((bookmark) =>
    bookmark.article.categories.map((item) => item.category.slug),
  );
  const historyCategorySlugs = accessEvents.flatMap((event) =>
    event.article.categories.map((item) => item.category.slug),
  );
  const historyArticleIds = accessEvents.map((event) => event.articleId);
  const followedAuthorIds = follows.map((item) => item.journalistId);
  const favoriteEditionIds = accessEvents.map((event) => event.article.editionId);
  const candidateFilters = [...new Set([
    ...followedAuthorIds,
    ...savedCategorySlugs,
    ...historyCategorySlugs,
    ...favoriteEditionIds,
  ])];

  if (!candidateFilters.length) {
    return {
      newsletterPreferences: parsePreferencesRecord(profile?.newsletterPreferences),
      notificationPreferences: parsePreferencesRecord(profile?.notificationPreferences),
      continueReading: accessEvents.slice(0, 4).map((event) => event.article),
      recommended: [],
    };
  }

  const candidates = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      deletedAt: null,
      id: { notIn: [...new Set(historyArticleIds)] },
      OR: [
        ...(followedAuthorIds.length ? [{ authorId: { in: followedAuthorIds } }] : []),
        ...(savedCategorySlugs.length || historyCategorySlugs.length
          ? [{ categories: { some: { category: { slug: { in: [...new Set(savedCategorySlugs), ...historyCategorySlugs] } } } } }]
          : []),
        ...(favoriteEditionIds.length ? [{ editionId: { in: [...new Set(favoriteEditionIds)] } }] : []),
      ],
    },
    include: {
      edition: true,
      author: true,
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: 12,
  });

  const recommended = rankRecommendedArticles(candidates, {
    savedCategorySlugs: [...new Set(savedCategorySlugs)],
    followedAuthorIds,
    historyCategorySlugs: [...new Set(historyCategorySlugs)],
    historyArticleIds,
    favoriteEditionIds: [...new Set(favoriteEditionIds)],
  }).slice(0, 6);

  const continueReading = accessEvents.slice(0, 4).map((event) => event.article);

  return {
    newsletterPreferences: parsePreferencesRecord(profile?.newsletterPreferences),
    notificationPreferences: parsePreferencesRecord(profile?.notificationPreferences),
    continueReading,
    recommended,
  };
}

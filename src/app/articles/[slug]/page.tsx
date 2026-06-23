import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Crown,
} from "lucide-react";
import { ArticleBody } from "@/components/article/article-body";
import { EditorialStoryCard } from "@/components/newsroom/editorial-story-card";
import { ConditionalNewsImage } from "@/components/newsroom/conditional-news-image";
import { TrendingNow } from "@/components/newsroom/trending-now";
import { StructuredDataScript } from "@/components/seo/structured-data-script";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { resolveArticleHeroImage, resolveArticleImage, selectArticlePageSource } from "@/lib/article-rendering";
import { getArticleBySlug, normalizeArticleRouteSlug } from "@/lib/articles";
import { getHomepageNewsResponse, getHomepageStoryBySlug } from "@/lib/news-providers";
import { getSeedStoryBySlug, seededEditorialStories } from "@/lib/news-providers/seed-content";
import {
  getNewsroomDeskLabel,
  selectRelatedStories,
  selectTrendingStories,
  toRecommendationStory,
  type StoryRecommendationInput,
} from "@/lib/article-experience";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, buildArticleStructuredData, buildPageMetadata, resolvePublicTaxonomyHref } from "@/lib/seo";
import { getCurrentUser } from "@/lib/server-auth";
import { siteConfig } from "@/lib/site";
import { canAccessArticle } from "@/lib/subscriptions";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatPublisherName(sourceName: string) {
  return sourceName.replace(/\s+RSS$/i, "").trim();
}

function normalizeComparableText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldShowLeadSection(excerpt: string | null | undefined, lead: string | null | undefined) {
  const normalizedExcerpt = normalizeComparableText(excerpt);
  const normalizedLead = normalizeComparableText(lead);

  if (!normalizedLead) {
    return false;
  }

  if (!normalizedExcerpt) {
    return true;
  }

  return normalizedExcerpt !== normalizedLead;
}

function formatPublishedDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelatedTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return "Latest coverage";
  }

  return `Published ${formatPublishedDate(value)}`;
}

function getArticleDeskName(category: string | null | undefined, fallback: string) {
  return getNewsroomDeskLabel(category ?? fallback);
}

function getArticleCategoryPath(slugOrName: string | null | undefined) {
  if (!slugOrName) {
    return "/categories";
  }

  return resolvePublicTaxonomyHref(slugify(slugOrName));
}

function buildArticleHeaderMeta(items: Array<{ icon?: ReactNode; label: string | null | undefined }>) {
  return items.filter((item): item is { icon?: ReactNode; label: string } => Boolean(item.label?.trim()));
}

function ArticleHeader({
  breadcrumbs,
  categoryLabel,
  categoryHref,
  secondaryBadge,
  metaItems,
  title,
  summary,
}: {
  breadcrumbs: { label: string; href?: string }[];
  categoryLabel: string;
  categoryHref: string;
  secondaryBadge?: ReactNode;
  metaItems: Array<{ icon?: ReactNode; label: string }>;
  title: string;
  summary?: string | null;
}) {
  return (
    <header className="space-y-4 sm:space-y-5">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
        {breadcrumbs.map((item, index) => (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
            {item.href ? (
              <Link href={item.href} className="transition hover:text-[var(--foreground)]">
                {item.label}
              </Link>
            ) : (
              <span className="max-w-[24rem] truncate text-[var(--foreground)]/75">{item.label}</span>
            )}
            {index < breadcrumbs.length - 1 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-center gap-2.5">
        <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em]">
          <Link href={categoryHref}>{categoryLabel}</Link>
        </Badge>
        {secondaryBadge}
      </div>
      {metaItems.length ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--muted-foreground)]">
          {metaItems.map((item, index) => (
            <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {item.icon}
              <span>{item.label}</span>
              {index < metaItems.length - 1 ? <span className="ml-1 text-slate-300">•</span> : null}
            </span>
          ))}
        </div>
      ) : null}
      <div className="space-y-3">
        <h1 className="max-w-[930px] font-serif text-[2.15rem] leading-[1.04] tracking-[-0.015em] text-slate-950 sm:text-[2.6rem] lg:text-[2.95rem]">
          {title}
        </h1>
        {summary ? (
          <p className="max-w-[860px] text-[1.02rem] leading-[1.95] text-[var(--muted-foreground)] sm:text-[1.08rem]">
            {summary}
          </p>
        ) : null}
      </div>
    </header>
  );
}

function toPreviewRecommendationStory(story: NonNullable<Awaited<ReturnType<typeof getHomepageStoryBySlug>>>) {
  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    category: story.category,
    summary: story.summary,
    publishedAt: story.publishedAt,
    tags: story.tags,
    href: story.href ?? `/articles/${story.slug}`,
    isExternal: story.isExternal,
    isBreaking: story.isBreaking,
    isMostRead: story.isMostRead,
    featuredImageAlt: story.featuredImageAlt,
    featuredImageUrl: story.featuredImageUrl,
    sourceName: story.sourceName,
  } satisfies StoryRecommendationInput;
}

function toInternalRecommendationStory(article: {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  categories: { category: { name: string } }[];
  tags?: { tag: { name: string } }[];
}) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.categories[0]?.category.name ?? "News",
    summary: article.excerpt ?? "",
    publishedAt: (article.publishedAt ?? new Date()).toISOString(),
    tags: article.tags?.map((item) => item.tag.name) ?? [],
    href: `/articles/${article.slug}`,
  } satisfies StoryRecommendationInput;
}

function getDemoArticle(slug: string) {
  const story = getSeedStoryBySlug(normalizeArticleRouteSlug(slug));
  if (!story) {
    return null;
  }

  return {
    id: `demo-${story.slug}`,
    slug,
    title: story.title,
    excerpt: story.summary,
    seoTitle: story.seoTitle,
    seoDescription: story.seoDescription,
    featuredImageUrl: story.featuredImageUrl ?? null,
    featuredImageAlt: story.featuredImageAlt ?? story.title,
    body: {
      type: "doc",
      content: story.content.map((paragraph) => ({
        type: "paragraph",
        text: paragraph,
      })),
    },
    updatedOn: new Date(),
    updatedAt: new Date(),
    correctionNotice: null,
    correctionIssuedAt: null,
    status: "PUBLISHED" as const,
    articleType: story.isOpinion ? "OPINION" as const : story.isLive ? "LIVE_BLOG" as const : "NEWS" as const,
    accessTier: "FREE" as const,
    publishedAt: new Date(story.publishedAt),
    deletedAt: null,
    readingTimeMinutes: story.readingTimeMinutes,
    premiumPreview: null,
    author: {
      id: `demo-author-${story.author.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: story.author.name,
      email: "journalist@globalpress.network",
      bio: `${story.author.role} covering ${story.category.toLowerCase()} developments for VANTERENPRESS.`,
      socialLinks: ["X: https://x.com/globalpress", "LinkedIn: https://linkedin.com/company/globalpress"],
    },
    edition: {
      id: `demo-edition-${story.edition.toLowerCase().replace(/\s+/g, "-")}`,
      name: story.edition,
      code: story.edition.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
      region: story.region,
    },
    categories: [{
      categoryId: `demo-category-${story.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      category: {
        id: `demo-category-${story.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: story.category,
        slug: story.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
    }],
    citations: [],
    workflowSteps: [],
    liveUpdates: [],
    comments: [],
  };
}

const publicArticleInclude = {
  author: true,
  edition: true,
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  liveUpdates: { orderBy: { publishedAt: "desc" as const } },
  media: {
    select: {
      url: true,
      thumbnailUrl: true,
      altText: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

async function findFullDatabaseArticleByRouteSlug(slug: string) {
  const exactSlug = slug.trim();
  const normalizedSlug = normalizeArticleRouteSlug(slug);

  const exactMatch = await prisma.article.findUnique({
    where: { slug: exactSlug },
    include: publicArticleInclude,
  });

  if (exactMatch) {
    return exactMatch;
  }

  if (!normalizedSlug || normalizedSlug === exactSlug) {
    return null;
  }

  return prisma.article.findUnique({
    where: { slug: normalizedSlug },
    include: publicArticleInclude,
  });
}

function getDemoArticleSidebar(slug: string) {
  const seedRelated = seededEditorialStories
    .filter((story) => story.slug !== slug)
    .slice(0, 3)
    .map((story) => ({
      id: `demo-related-${story.slug}`,
      slug: story.slug,
      title: story.title,
      edition: { name: story.edition },
      categories: [{ category: { name: story.category } }],
      articleType: story.isOpinion ? "OPINION" : story.isLive ? "LIVE_BLOG" : "NEWS",
    }));

  const currentStory = getSeedStoryBySlug(slug);
  const seedCategoryMatches = seededEditorialStories
    .filter((story) => story.slug !== slug && currentStory && story.category === currentStory.category)
    .slice(0, 3)
    .map((story) => ({
      id: `demo-category-${story.slug}`,
      slug: story.slug,
      title: story.title,
      edition: { name: story.edition },
      categories: [{ category: { name: story.category } }],
      articleType: story.isOpinion ? "OPINION" : story.isLive ? "LIVE_BLOG" : "NEWS",
    }));

  return [
    { allowed: true },
    seedRelated,
    seedCategoryMatches,
  ] as const;
}

async function getExternalPreviewStory(slug: string) {
  const story = await getHomepageStoryBySlug(slug);
  return story?.isExternal ? story : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = normalizeArticleRouteSlug(slug);
  const databaseAvailable = await isDatabaseAvailable();
  const article = await (async () => {
    if (!databaseAvailable) {
      return getDemoArticle(normalizedSlug);
    }

    try {
      return (await getArticleBySlug(slug)) ?? getDemoArticle(normalizedSlug);
    } catch {
      return getDemoArticle(normalizedSlug);
    }
  })();
  const externalStory = article ? null : await getExternalPreviewStory(normalizedSlug);

  if (!article && !externalStory) {
    return {};
  }

  const resolvedArticle = article ?? null;
  const resolvedExternalStory = externalStory ?? null;
  const title = resolvedExternalStory
    ? resolvedExternalStory.seoTitle ?? resolvedExternalStory.title
    : resolvedArticle!.seoTitle ?? resolvedArticle!.title;
  const description = resolvedExternalStory
    ? resolvedExternalStory.seoDescription ?? resolvedExternalStory.summary ?? siteConfig.description
    : resolvedArticle!.seoDescription ?? resolvedArticle!.excerpt ?? siteConfig.description;
  const articlePath = `/articles/${resolvedExternalStory?.slug ?? resolvedArticle!.slug}`;
  const publishedTime = resolvedExternalStory ? resolvedExternalStory.publishedAt : resolvedArticle!.publishedAt?.toISOString();
  const modifiedTime = resolvedExternalStory
    ? resolvedExternalStory.publishedAt
    : resolvedArticle!.updatedOn?.toISOString() ?? resolvedArticle!.updatedAt.toISOString();
  const section = resolvedExternalStory
    ? resolvedExternalStory.category
    : resolvedArticle!.articleType;
  const sourceName = resolvedExternalStory ? formatPublisherName(resolvedExternalStory.sourceName) : siteConfig.name;
  const image = resolvedExternalStory
    ? resolveArticleHeroImage({
        slug: resolvedExternalStory.slug,
        category: resolvedExternalStory.category,
        title: resolvedExternalStory.title,
        summary: resolvedExternalStory.summary,
        featuredImageUrl: resolvedExternalStory.featuredImageUrl,
        featuredImageAlt: resolvedExternalStory.featuredImageAlt,
      })
    : resolvedArticle
      ? resolveArticleHeroImage({
          slug: resolvedArticle.slug,
          category: resolvedArticle.articleType,
          title: resolvedArticle.title,
          summary: resolvedArticle.excerpt ?? "",
          featuredImageUrl: resolvedArticle.featuredImageUrl,
          featuredImageAlt: resolvedArticle.featuredImageAlt,
        })
      : null;

  return buildPageMetadata({
    title,
    description,
    path: articlePath,
    type: "article",
    image,
    publishedTime,
    modifiedTime,
    section,
    keywords: [siteConfig.name, section, sourceName],
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalizedSlug = normalizeArticleRouteSlug(slug);
  const databaseAvailable = await isDatabaseAvailable();
  const [dbArticle, user, externalStory] = await (async () => {
    if (!databaseAvailable) {
      return [getDemoArticle(normalizedSlug), null, null] as const;
    }

    try {
      const [article, currentUser] = await Promise.all([
        findFullDatabaseArticleByRouteSlug(slug),
        getCurrentUser(),
      ] as const);

      if (article) {
        return [article, currentUser, null] as const;
      }

      return [null, currentUser, await getExternalPreviewStory(normalizedSlug)] as const;
    } catch {
      return [getDemoArticle(normalizedSlug), null, null] as const;
    }
  })();
  const source = selectArticlePageSource({
    article: dbArticle,
    externalStory,
  });

  if (source.kind === "missing") {
    notFound();
  }

  const article = source.article;
  const resolvedExternalStory = source.externalStory;

  if (!resolvedExternalStory && (!article || article.deletedAt || article.status !== "PUBLISHED")) {
    notFound();
  }

  const homepageResponse = await getHomepageNewsResponse();
  const homepageStories = [
    homepageResponse.bundle.heroStory,
    ...homepageResponse.bundle.topStories,
    ...homepageResponse.bundle.worldNews,
    ...homepageResponse.bundle.businessNews,
    ...homepageResponse.bundle.technologyNews,
    ...homepageResponse.bundle.sportsNews,
    ...homepageResponse.bundle.liveCoverage,
    ...homepageResponse.bundle.opinion,
    ...homepageResponse.bundle.mostRead,
  ].map(toRecommendationStory);
  const trendingStories = selectTrendingStories(homepageStories, 5);

  if (resolvedExternalStory) {
    const publisherName = formatPublisherName(resolvedExternalStory.sourceName);
    const deskLabel = getNewsroomDeskLabel(resolvedExternalStory.category);
    const categoryPath = getArticleCategoryPath(resolvedExternalStory.category);
    const leadText = resolvedExternalStory.content[0] ?? resolvedExternalStory.summary;
    const showLeadSection = shouldShowLeadSection(resolvedExternalStory.summary, leadText);
    const imageSelection = resolveArticleImage({
      slug: resolvedExternalStory.slug,
      category: resolvedExternalStory.category,
      title: resolvedExternalStory.title,
      summary: resolvedExternalStory.summary,
      featuredImageUrl: resolvedExternalStory.featuredImageUrl,
      featuredImageAlt: resolvedExternalStory.featuredImageAlt,
    }, {
      preferPremium: true,
      minimumScore: 28,
    });
    const relatedStories = selectRelatedStories(
      toPreviewRecommendationStory(resolvedExternalStory),
      homepageStories,
      3,
    );
    const usedRelatedImages: string[] = imageSelection.source === "fallback" && imageSelection.imageUrl
      ? [imageSelection.imageUrl]
      : [];
    const previewStructuredData = buildArticleStructuredData({
      title: resolvedExternalStory.title,
      description: resolvedExternalStory.summary,
      url: absoluteUrl(`/articles/${resolvedExternalStory.slug}`),
      publishedTime: resolvedExternalStory.publishedAt,
      modifiedTime: resolvedExternalStory.publishedAt,
      section: resolvedExternalStory.category,
      image: imageSelection.imageUrl,
      authorName: publisherName,
      breadcrumbs: [
        { name: "Home", url: absoluteUrl("/") },
        { name: resolvedExternalStory.category, url: absoluteUrl(categoryPath) },
        { name: resolvedExternalStory.title, url: absoluteUrl(`/articles/${resolvedExternalStory.slug}`) },
      ],
      isAccessibleForFree: true,
    });

    return (
      <main className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <StructuredDataScript data={previewStructuredData} />
        <article className="rounded-[32px] bg-white px-5 py-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <ArticleHeader
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: resolvedExternalStory.category, href: categoryPath },
              { label: resolvedExternalStory.title },
            ]}
            categoryLabel={resolvedExternalStory.category}
            categoryHref={categoryPath}
            secondaryBadge={<Badge variant="neutral" className="rounded-full px-3 py-1 text-[11px] tracking-[0.14em]">Syndicated report</Badge>}
            metaItems={buildArticleHeaderMeta([
              { icon: <Clock3 className="h-3.5 w-3.5" />, label: `${resolvedExternalStory.readingTimeMinutes} min read` },
              { icon: <CalendarDays className="h-3.5 w-3.5" />, label: `Published ${formatPublishedDate(resolvedExternalStory.publishedAt)}` },
            ])}
            title={resolvedExternalStory.title}
            summary={resolvedExternalStory.summary}
          />
          <div className="mt-5 grid gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--muted)]/28 px-4 py-4 sm:grid-cols-3 sm:px-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Desk</div>
              <div className="mt-1 text-sm font-medium text-[var(--foreground)]">{deskLabel}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Published</div>
              <div className="mt-1 text-sm text-[var(--foreground)]">{formatPublishedDate(resolvedExternalStory.publishedAt)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Source</div>
              <div className="mt-1 text-sm text-[var(--foreground)]">{publisherName}</div>
            </div>
          </div>
          {imageSelection.imageUrl ? (
            <ConditionalNewsImage
              src={imageSelection.imageUrl}
              alt={imageSelection.imageAlt ?? resolvedExternalStory.title}
              sizes="(max-width: 1024px) 100vw, 1040px"
              containerClassName="relative mt-7 h-[250px] overflow-hidden rounded-[28px] border border-black/6 bg-[var(--muted)] shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:h-[340px] lg:h-[430px] xl:max-w-[1040px]"
              imageClassName="object-cover object-center"
            />
          ) : null}
          <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.56fr)_minmax(260px,0.5fr)] xl:gap-9">
            <div className="space-y-5">
              {showLeadSection ? (
                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--muted)]/38 px-5 py-4 sm:px-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Lead
                  </div>
                  <p className="mt-2 text-[1rem] leading-[1.9] text-[var(--foreground)]">
                    {leadText}
                  </p>
                </div>
              ) : null}
              <Button asChild className="h-11 px-5 bg-[#D8261D] shadow-[0_10px_24px_rgba(216,38,29,0.18)] hover:bg-[#bf1f18]">
                <a href={resolvedExternalStory.sourceUrl ?? "#"} target="_blank" rel="noreferrer">
                  Continue reading at {publisherName}
                </a>
              </Button>
            </div>
            <aside className="space-y-4 xl:sticky xl:top-32 xl:self-start">
              <Card className="overflow-hidden rounded-[24px] border-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <CardHeader className="border-b border-[var(--border)] pb-3">
                  <CardTitle className="text-[1.05rem]">Source details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="grid gap-3.5">
                    <div className="border-b border-[var(--border)] pb-3.5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Publisher</div>
                      <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{publisherName}</div>
                    </div>
                    <div className="border-b border-[var(--border)] pb-3.5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Published</div>
                      <div className="mt-1 text-sm leading-6 text-[var(--foreground)]">{new Date(resolvedExternalStory.publishedAt).toLocaleString()}</div>
                    </div>
                  <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Category</div>
                      <div className="mt-1 text-sm text-[var(--foreground)]">
                        <Link href={categoryPath} className="underline underline-offset-4">
                          {resolvedExternalStory.category}
                        </Link>
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="h-10 w-full justify-center border-[var(--border)] bg-white text-[13px] font-semibold">
                    <a href={resolvedExternalStory.sourceUrl ?? "#"} target="_blank" rel="noreferrer">
                      Visit publisher
                    </a>
                  </Button>
                </CardContent>
              </Card>
              <TrendingNow
                compact
                items={trendingStories.map((story) => ({
                  id: story.id,
                  href: story.href ?? `/articles/${story.slug}`,
                  title: story.title,
                  category: story.category,
                  isExternal: story.isExternal,
                }))}
              />
            </aside>
          </div>
        </article>
        <section className="mt-11">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-[#D8261D]" />
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Further Reading</div>
              <h2 className="mt-1 font-serif text-[2rem] text-[var(--foreground)]">Related Stories</h2>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {relatedStories.map((story) => {
              const nextRelatedImage = resolveArticleImage({
                slug: story.slug,
                category: story.category,
                title: story.title,
                summary: story.summary,
                featuredImageUrl: story.featuredImageUrl,
                featuredImageAlt: story.featuredImageAlt,
              }, {
                usedImages: usedRelatedImages,
                preferPremium: true,
                minimumScore: 28,
              });
              const relatedImage = nextRelatedImage.imageUrl;

              if (nextRelatedImage.source === "fallback" && relatedImage) {
                usedRelatedImages.push(relatedImage);
              }

              return (
                <EditorialStoryCard
                  key={story.id}
                  href={story.href ?? `/articles/${story.slug}`}
                  isExternal={story.isExternal}
                  title={story.title}
                  category={story.category}
                  summary={story.summary}
                  publishedLabel={formatRelatedTimestamp(story.publishedAt)}
                  imageUrl={relatedImage}
                  imageAlt={nextRelatedImage.imageAlt ?? story.title}
                />
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  const articleRecord = article!;
  console.info("Rendering public article image", {
    slug: articleRecord.slug,
    featuredImageUrl: articleRecord.featuredImageUrl,
  });

  const [access, relatedArticles, moreFromCategory] = await (async () => {
    if (!databaseAvailable) {
      return getDemoArticleSidebar(slug);
    }

    try {
      return await Promise.all([
        canAccessArticle({
          articleId: articleRecord.id,
          accessTier: articleRecord.accessTier,
          userId: user?.id,
        }),
        prisma.article.findMany({
          where: {
            status: "PUBLISHED",
            deletedAt: null,
            id: { not: articleRecord.id },
            editionId: "editionId" in articleRecord ? articleRecord.editionId : articleRecord.edition.id,
          },
          include: {
            edition: true,
            categories: { include: { category: true } },
            media: {
              select: {
                url: true,
                thumbnailUrl: true,
                altText: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { publishedAt: "desc" },
          take: 3,
        }),
        prisma.article.findMany({
          where: {
            status: "PUBLISHED",
            deletedAt: null,
            id: { not: articleRecord.id },
            categories: {
              some: {
                categoryId: articleRecord.categories[0]?.categoryId,
              },
            },
          },
          include: {
            edition: true,
            categories: { include: { category: true } },
            media: {
              select: {
                url: true,
                thumbnailUrl: true,
                altText: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { publishedAt: "desc" },
          take: 3,
        }),
      ]);
    } catch {
      return getDemoArticleSidebar(slug);
    }
  })();

  const cookieStore = await cookies();
  const meterSession = cookieStore.get("gpn-meter-session")?.value ?? "guest";

  if (databaseAvailable) {
    await prisma.readerAccessEvent.create({
      data: {
        articleId: articleRecord.id,
        userId: user?.id ?? null,
        sessionId: meterSession,
      },
    }).catch(() => null);
  }

  const heroImage = resolveArticleImage({
    slug: articleRecord.slug,
    category: articleRecord.categories[0]?.category.name ?? articleRecord.articleType,
    title: articleRecord.title,
    summary: articleRecord.excerpt ?? "",
    featuredImageUrl: articleRecord.featuredImageUrl,
    featuredImageAlt: articleRecord.featuredImageAlt,
    media: "media" in articleRecord ? articleRecord.media ?? [] : [],
  }, {
    preferPremium: true,
    minimumScore: 28,
  });
  const categoryName = articleRecord.categories[0]?.category.name ?? getArticleDeskName(null, articleRecord.articleType);
  const categoryPath = getArticleCategoryPath(articleRecord.categories[0]?.category.slug ?? categoryName);
  const structuredData = buildArticleStructuredData({
    title: articleRecord.title,
    description: articleRecord.excerpt ?? siteConfig.description,
    url: absoluteUrl(`/articles/${articleRecord.slug}`),
    publishedTime: articleRecord.publishedAt?.toISOString(),
    modifiedTime: (articleRecord.updatedOn ?? articleRecord.updatedAt).toISOString(),
    section: categoryName,
    image: heroImage.imageUrl,
    authorName: articleRecord.author?.name ?? getArticleDeskName(categoryName, articleRecord.articleType),
    breadcrumbs: [
      { name: "Home", url: absoluteUrl("/") },
      { name: categoryName, url: absoluteUrl(categoryPath) },
      { name: articleRecord.title, url: absoluteUrl(`/articles/${articleRecord.slug}`) },
    ],
    isAccessibleForFree: articleRecord.accessTier === "FREE",
  });
  const relatedCandidates = [
    ...moreFromCategory.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      category: item.categories[0]?.category.name ?? item.articleType,
      summary: "",
      publishedAt: new Date().toISOString(),
      tags: [],
      href: `/articles/${item.slug}`,
      isExternal: false,
      featuredImageAlt: null,
      featuredImageUrl: "featuredImageUrl" in item ? item.featuredImageUrl ?? null : null,
      media: "media" in item ? item.media ?? [] : [],
    })),
    ...relatedArticles.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      category: item.categories[0]?.category.name ?? item.articleType,
      summary: "",
      publishedAt: new Date().toISOString(),
      tags: [],
      href: `/articles/${item.slug}`,
      isExternal: false,
      featuredImageAlt: null,
      featuredImageUrl: "featuredImageUrl" in item ? item.featuredImageUrl ?? null : null,
      media: "media" in item ? item.media ?? [] : [],
    })),
    ...homepageStories,
  ];
  const relatedStories = selectRelatedStories(
    toInternalRecommendationStory(articleRecord),
    relatedCandidates,
    3,
  );
  const usedRelatedImages: string[] = heroImage.source === "fallback" && heroImage.imageUrl ? [heroImage.imageUrl] : [];

  return (
    <main className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <StructuredDataScript data={structuredData} />
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.56fr)_minmax(280px,0.48fr)] xl:gap-10">
        <article>
          <ArticleHeader
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: categoryName, href: categoryPath },
              { label: articleRecord.title },
            ]}
            categoryLabel={categoryName}
            categoryHref={categoryPath}
            secondaryBadge={articleRecord.accessTier !== "FREE"
              ? <Badge variant="neutral" className="rounded-full px-3 py-1 text-[11px] tracking-[0.14em]"><Crown className="mr-1 h-3.5 w-3.5" /> Premium</Badge>
              : undefined}
            metaItems={buildArticleHeaderMeta([
              { icon: <Clock3 className="h-3.5 w-3.5" />, label: `${articleRecord.readingTimeMinutes} min read` },
              { icon: <CalendarDays className="h-3.5 w-3.5" />, label: `Published ${formatPublishedDate(articleRecord.publishedAt ?? articleRecord.updatedAt)}` },
            ])}
            title={articleRecord.title}
            summary={articleRecord.excerpt ?? "Enterprise publishing requires editorial authority, regional targeting, monetization strategy, and platform-grade delivery in the same system."}
          />
          {!access.allowed ? (
            <div className="mt-6 rounded-[24px] border border-[var(--accent)] bg-[var(--accent-soft)] p-5 text-sm">
              You are reading a metered preview. Subscribe to continue with premium reporting.
            </div>
          ) : null}
          {heroImage.imageUrl ? (
            <ConditionalNewsImage
              src={heroImage.imageUrl}
              alt={heroImage.imageAlt ?? articleRecord.title}
              sizes="(max-width: 1024px) 100vw, 1040px"
              containerClassName="relative mt-7 h-[250px] overflow-hidden rounded-[28px] border border-black/6 bg-[var(--muted)] shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:h-[340px] lg:h-[430px] xl:max-w-[1040px]"
              imageClassName="object-cover object-center"
            />
          ) : null}
          <Card className="mt-7 overflow-hidden rounded-[28px] border-black/5 bg-white/96 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <CardContent className="p-6 sm:p-7 lg:p-9">
              {access.allowed ? (
                <ArticleBody body={articleRecord.body} />
              ) : (
                <EmptyState
                  title="Premium article"
                  description={articleRecord.premiumPreview ?? "You have reached the free article limit for this month. Subscribe to continue reading premium coverage."}
                />
              )}
            </CardContent>
          </Card>
          {articleRecord.liveUpdates.length ? (
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-3xl">Live updates</h2>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/live/${articleRecord.slug}`}>Open live page</Link>
                </Button>
              </div>
              <div className="space-y-4">
                {articleRecord.liveUpdates.slice(0, 3).map((update) => (
                  <Card key={update.id}>
                    <CardContent className="p-6">
                      <div className="text-sm text-[var(--muted-foreground)]">{update.publishedAt.toLocaleString()}</div>
                      <div className="mt-2 font-semibold">{update.title}</div>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{update.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </article>
        <aside className="space-y-4 xl:sticky xl:top-32 xl:self-start">
          <TrendingNow
            compact
            items={trendingStories.map((story) => ({
              id: story.id,
              href: story.href ?? `/articles/${story.slug}`,
              title: story.title,
              category: story.category,
              isExternal: story.isExternal,
            }))}
          />
        </aside>
      </div>
      <section className="mt-11">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-[#D8261D]" />
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Further Reading</div>
            <h2 className="mt-1 font-serif text-[2rem] text-[var(--foreground)]">Related Stories</h2>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {relatedStories.map((story) => {
            const nextRelatedImage = resolveArticleImage({
              slug: story.slug,
              category: story.category,
              title: story.title,
              summary: story.summary,
              featuredImageUrl: "featuredImageUrl" in story ? story.featuredImageUrl ?? null : null,
              featuredImageAlt: story.featuredImageAlt,
              media: "media" in story ? story.media ?? [] : [],
            }, {
              usedImages: usedRelatedImages,
              preferPremium: true,
              minimumScore: 28,
            });
            const relatedImage = nextRelatedImage.imageUrl;

            if (nextRelatedImage.source === "fallback" && relatedImage) {
              usedRelatedImages.push(relatedImage);
            }

            return (
              <EditorialStoryCard
                key={story.id}
                href={story.href ?? `/articles/${story.slug}`}
                isExternal={story.isExternal}
                title={story.title}
                category={story.category}
                summary={story.summary || "Read the next VANTERENPRESS report connected to this developing story."}
                publishedLabel={formatRelatedTimestamp(story.publishedAt)}
                imageUrl={relatedImage}
                imageAlt={nextRelatedImage.imageAlt ?? story.title}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}

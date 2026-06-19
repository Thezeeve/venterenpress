import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock3,
  Crown,
} from "lucide-react";
import { ArticleBody } from "@/components/article/article-body";
import { EditorialStoryCard } from "@/components/newsroom/editorial-story-card";
import { ConditionalNewsImage } from "@/components/newsroom/conditional-news-image";
import { TrendingNow } from "@/components/newsroom/trending-now";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getHomepageNewsResponse, getHomepageStoryBySlug } from "@/lib/news-providers";
import { resolveNewsImageSelection } from "@/lib/news-providers/sanitize-news-image";
import { getSeedStoryBySlug, seededEditorialStories } from "@/lib/news-providers/seed-content";
import {
  getNewsroomDeskLabel,
  selectRelatedStories,
  selectTrendingStories,
  toRecommendationStory,
  type StoryRecommendationInput,
} from "@/lib/article-experience";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";
import { siteConfig } from "@/lib/site";
import { canAccessArticle } from "@/lib/subscriptions";

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
  const story = getSeedStoryBySlug(slug);
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
  const databaseAvailable = await isDatabaseAvailable();
  const article = await (async () => {
    if (!databaseAvailable) {
      return getDemoArticle(slug);
    }

    try {
      return (await prisma.article.findUnique({ where: { slug } })) ?? getDemoArticle(slug);
    } catch {
      return getDemoArticle(slug);
    }
  })();
  const externalStory = article ? null : await getExternalPreviewStory(slug);

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
  const canonicalUrl = `${siteConfig.url}/articles/${resolvedExternalStory?.slug ?? resolvedArticle!.slug}`;
  const publishedTime = resolvedExternalStory ? resolvedExternalStory.publishedAt : resolvedArticle!.publishedAt?.toISOString();
  const modifiedTime = resolvedExternalStory
    ? resolvedExternalStory.publishedAt
    : resolvedArticle!.updatedOn?.toISOString() ?? resolvedArticle!.updatedAt.toISOString();
  const section = resolvedExternalStory
    ? resolvedExternalStory.category
    : resolvedArticle!.articleType;
  const sourceName = resolvedExternalStory ? formatPublisherName(resolvedExternalStory.sourceName) : siteConfig.name;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      images: [`${siteConfig.url}/opengraph-image`],
      publishedTime,
      modifiedTime,
      section,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@vanterenpress",
    },
    keywords: [siteConfig.name, section, sourceName],
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const databaseAvailable = await isDatabaseAvailable();
  const externalStory = await getExternalPreviewStory(slug);
  const [article, user] = await (async () => {
    if (externalStory) {
      return [null, null] as const;
    }

    if (!databaseAvailable) {
      return [getDemoArticle(slug), null] as const;
    }

    try {
      const [dbArticle, currentUser] = await Promise.all([
        prisma.article.findUnique({
          where: { slug },
          include: {
            author: true,
            edition: true,
            categories: { include: { category: true } },
            tags: { include: { tag: true } },
            liveUpdates: { orderBy: { publishedAt: "desc" } },
          },
        }),
        getCurrentUser(),
      ] as const);

      return [dbArticle ?? getDemoArticle(slug), currentUser] as const;
    } catch {
      return [getDemoArticle(slug), null] as const;
    }
  })();

  if (!externalStory && (!article || article.deletedAt || article.status !== "PUBLISHED")) {
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

  if (externalStory) {
    const publisherName = formatPublisherName(externalStory.sourceName);
    const deskLabel = getNewsroomDeskLabel(externalStory.category);
    const leadText = externalStory.content[0] ?? externalStory.summary;
    const showLeadSection = shouldShowLeadSection(externalStory.summary, leadText);
    const imageSelection = resolveNewsImageSelection({
      slug: externalStory.slug,
      category: externalStory.category,
      title: externalStory.title,
      summary: externalStory.summary,
      preferPremium: true,
      minimumScore: 28,
    });
    const relatedStories = selectRelatedStories(
      toPreviewRecommendationStory(externalStory),
      homepageStories,
      3,
    );
    const usedRelatedImages: string[] = imageSelection.imageUrl ? [imageSelection.imageUrl] : [];
    const previewStructuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["NewsArticle", "Article"],
          headline: externalStory.title,
          description: externalStory.summary,
          datePublished: externalStory.publishedAt,
          articleSection: externalStory.category,
          author: {
            "@type": "Organization",
            name: getNewsroomDeskLabel(externalStory.category),
          },
          publisher: {
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
          },
          isBasedOn: externalStory.sourceUrl ?? undefined,
          mainEntityOfPage: `${siteConfig.url}/articles/${externalStory.slug}`,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: siteConfig.url,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: externalStory.category,
              item: `${siteConfig.url}/articles/${externalStory.slug}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: externalStory.title,
              item: `${siteConfig.url}/articles/${externalStory.slug}`,
            },
          ],
        },
      ],
    };

    return (
      <main className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(previewStructuredData) }} />
        <article className="rounded-[32px] bg-white px-5 py-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{externalStory.category}</Badge>
            <Badge variant="neutral" className="px-2.5 py-1 text-[11px] tracking-[0.14em]">Syndicated report</Badge>
            <div className="text-sm text-[var(--muted-foreground)]">{new Date(externalStory.publishedAt).toLocaleString()}</div>
          </div>
          <h1 className="mt-4 max-w-[920px] font-serif text-[2.1rem] leading-[1.05] tracking-[-0.015em] text-slate-950 sm:text-[2.55rem] lg:text-[2.9rem]">
            {externalStory.title}
          </h1>
          <div className="mt-5 grid gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--muted)]/28 px-4 py-4 sm:grid-cols-3 sm:px-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Desk</div>
              <div className="mt-1 text-sm font-medium text-[var(--foreground)]">{deskLabel}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Published</div>
              <div className="mt-1 text-sm text-[var(--foreground)]">{formatPublishedDate(externalStory.publishedAt)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Source</div>
              <div className="mt-1 text-sm text-[var(--foreground)]">{publisherName}</div>
            </div>
          </div>
          {imageSelection.isStrongMatch && imageSelection.imageUrl ? (
            <ConditionalNewsImage
              src={imageSelection.imageUrl}
              alt={externalStory.featuredImageAlt ?? externalStory.title}
              sizes="(max-width: 1024px) 100vw, 1040px"
              containerClassName="relative mt-7 h-[250px] overflow-hidden rounded-[28px] border border-black/6 bg-[var(--muted)] shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:h-[340px] lg:h-[430px] xl:max-w-[1040px]"
              imageClassName="object-cover object-center"
            />
          ) : null}
          <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.56fr)_minmax(260px,0.5fr)] xl:gap-9">
            <div className="space-y-5">
              <p className="max-w-[860px] text-[1.02rem] leading-[1.95] text-[var(--muted-foreground)] sm:text-[1.08rem]">
                {externalStory.summary}
              </p>
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
                <a href={externalStory.sourceUrl ?? "#"} target="_blank" rel="noreferrer">
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
                      <div className="mt-1 text-sm leading-6 text-[var(--foreground)]">{new Date(externalStory.publishedAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Category</div>
                      <div className="mt-1 text-sm text-[var(--foreground)]">{externalStory.category}</div>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="h-10 w-full justify-center border-[var(--border)] bg-white text-[13px] font-semibold">
                    <a href={externalStory.sourceUrl ?? "#"} target="_blank" rel="noreferrer">
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
              const nextRelatedImage = resolveNewsImageSelection({
                slug: story.slug,
                category: story.category,
                title: story.title,
                summary: story.summary,
                usedImages: usedRelatedImages,
                preferPremium: true,
                minimumScore: 28,
              }).imageUrl;
              const relatedImage = nextRelatedImage && !usedRelatedImages.includes(nextRelatedImage)
                ? nextRelatedImage
                : null;

              if (relatedImage) {
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
                  imageAlt={story.featuredImageAlt ?? story.title}
                />
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  const articleRecord = article!;

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

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["NewsArticle", "Article"],
        headline: articleRecord.title,
        description: articleRecord.excerpt,
        datePublished: articleRecord.publishedAt?.toISOString(),
        dateModified: (articleRecord.updatedOn ?? articleRecord.updatedAt).toISOString(),
        articleSection: articleRecord.categories[0]?.category.name ?? articleRecord.articleType,
        author: {
          "@type": "Organization",
          name: getArticleDeskName(articleRecord.categories[0]?.category.name, articleRecord.articleType),
        },
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
        mainEntityOfPage: `${siteConfig.url}/articles/${articleRecord.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: articleRecord.categories[0]?.category.name ?? "Articles",
            item: `${siteConfig.url}/articles/${articleRecord.slug}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: articleRecord.title,
            item: `${siteConfig.url}/articles/${articleRecord.slug}`,
          },
        ],
      },
    ],
  };
  const heroImage = articleRecord.featuredImageUrl
    ? articleRecord.featuredImageUrl
    : resolveNewsImageSelection({
        slug: articleRecord.slug,
        category: articleRecord.categories[0]?.category.name ?? articleRecord.articleType,
        title: articleRecord.title,
        summary: articleRecord.excerpt ?? "",
        preferPremium: true,
        minimumScore: 28,
      }).imageUrl;
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
    })),
    ...homepageStories,
  ];
  const relatedStories = selectRelatedStories(
    toInternalRecommendationStory(articleRecord),
    relatedCandidates,
    3,
  );
  const usedRelatedImages: string[] = heroImage ? [heroImage] : [];

  return (
    <main className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.56fr)_minmax(280px,0.48fr)] xl:gap-10">
        <article>
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge>{articleRecord.categories[0]?.category.name ?? articleRecord.articleType}</Badge>
            {articleRecord.accessTier !== "FREE" ? (
              <Badge variant="neutral" className="px-2.5 py-1 text-[11px] tracking-[0.14em]"><Crown className="mr-1 h-3.5 w-3.5" /> Premium</Badge>
            ) : null}
            <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
              <Clock3 className="h-3.5 w-3.5" />
              {articleRecord.readingTimeMinutes} min read
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Published {formatPublishedDate(articleRecord.publishedAt ?? articleRecord.updatedAt)}
            </div>
          </div>
          {!access.allowed ? (
            <div className="mt-6 rounded-[24px] border border-[var(--accent)] bg-[var(--accent-soft)] p-5 text-sm">
              You are reading a metered preview. Subscribe to continue with premium reporting.
            </div>
          ) : null}
          <h1 className="mt-4 max-w-[930px] font-serif text-[2.15rem] leading-[1.04] tracking-[-0.015em] text-slate-950 sm:text-[2.6rem] lg:text-[2.95rem]">
            {articleRecord.title}
          </h1>
          <p className="mt-3.5 max-w-[860px] text-[1.02rem] leading-[1.95] text-[var(--muted-foreground)] sm:text-[1.08rem]">
            {articleRecord.excerpt ?? "Enterprise publishing requires editorial authority, regional targeting, monetization strategy, and platform-grade delivery in the same system."}
          </p>
          {heroImage ? (
            <ConditionalNewsImage
              src={heroImage}
              alt={articleRecord.featuredImageAlt ?? articleRecord.title}
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
            const nextRelatedImage = resolveNewsImageSelection({
              slug: story.slug,
              category: story.category,
              title: story.title,
              summary: story.summary,
              usedImages: usedRelatedImages,
              preferPremium: true,
              minimumScore: 28,
            }).imageUrl;
            const relatedImage = nextRelatedImage && !usedRelatedImages.includes(nextRelatedImage)
              ? nextRelatedImage
              : null;

            if (relatedImage) {
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
                imageAlt={story.featuredImageAlt ?? story.title}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}

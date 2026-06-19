"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ImageProps } from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, RadioTower } from "lucide-react";
import { toRecommendationStory, selectTrendingStories } from "@/lib/article-experience";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConditionalNewsImage } from "@/components/newsroom/conditional-news-image";
import { TrendingNow } from "@/components/newsroom/trending-now";
import type {
  EditorialStory,
  HomepageNewsApiResponse,
  HomepageNewsBundle,
  LatestSidebarItem,
} from "@/lib/news-providers/types";
import { resolveNewsImageSelection } from "@/lib/news-providers/sanitize-news-image";
import {
  summarizeNewsletterPreferences,
  summarizeNotificationPreferences,
  type NewsroomArticleCard,
} from "@/lib/newsroom";

export type PersonalizedHomepage = {
  newsletterPreferences: Record<string, unknown>;
  notificationPreferences?: Record<string, unknown>;
  continueReading: NewsroomArticleCard[];
  recommended: NewsroomArticleCard[];
};

type SectionStory = {
  id: string;
  title: string;
  href: string;
  category: string;
  time: string;
  image?: string | null;
  isExternal?: boolean;
};

const MotionDiv = motion.div;
function normalizeHomepageImageSrc(src?: string | null) {
  if (!src) {
    return null;
  }

  if (src.startsWith("/")) {
    return src;
  }

  if (src.startsWith("https://")) {
    return src;
  }

  return null;
}

function SafeNewsImage({
  src,
  alt,
  fill = true,
  className,
  sizes,
  priority,
  quality,
  onVisibilityChange,
}: {
  src?: string | null;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: ImageProps["quality"];
  onVisibilityChange?: (visible: boolean) => void;
}) {
  const [imageSrc, setImageSrc] = useState(normalizeHomepageImageSrc(src));
  const [hasError, setHasError] = useState(false);
  const isRemoteImage = imageSrc?.startsWith("https://") ?? false;

  useEffect(() => {
    setImageSrc(normalizeHomepageImageSrc(src));
    setHasError(false);
  }, [src]);

  useEffect(() => {
    onVisibilityChange?.(Boolean(imageSrc) && !hasError);
  }, [hasError, imageSrc, onVisibilityChange]);

  if (!imageSrc || hasError) {
    return null;
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill={fill}
      priority={priority}
      quality={quality}
      unoptimized={isRemoteImage}
      sizes={sizes}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

function formatClock(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeTime(value: string) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / (1000 * 60)));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.round(diffHours / 24)}d ago`;
}

function getStoryHref(article: EditorialStory) {
  return article.href ?? `/articles/${article.slug}`;
}

function resolveStoryImage(
  article: Pick<EditorialStory, "slug" | "title" | "category" | "featuredImageUrl" | "summary">,
  options?: { usedImages?: readonly string[]; preferPremium?: boolean; minimumScore?: number },
) {
  return resolveNewsImageSelection({
    slug: article.slug,
    category: article.category,
    title: article.title,
    summary: article.summary,
    usedImages: options?.usedImages,
    preferPremium: options?.preferPremium,
    minimumScore: options?.minimumScore,
  }).imageUrl;
}

function toSectionStory(article: EditorialStory, image: string | null): SectionStory {
  return {
    id: article.id,
    title: article.title,
    href: getStoryHref(article),
    category: article.category,
    time: formatRelativeTime(article.publishedAt),
    image,
    isExternal: article.isExternal,
  };
}

function StoryAnchor({
  href,
  isExternal,
  className,
  children,
}: {
  href: string;
  isExternal?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (isExternal && !href.startsWith("/")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function ButtonStoryLink({
  href,
  isExternal,
  label,
}: {
  href: string;
  isExternal?: boolean;
  label: string;
}) {
  if (isExternal && !href.startsWith("/")) {
    return (
      <Button asChild className="bg-[#D8261D] hover:bg-[#bf1f18]">
        <a href={href} target="_blank" rel="noreferrer">
          {label}
        </a>
      </Button>
    );
  }

  return (
    <Button asChild className="bg-[#D8261D] hover:bg-[#bf1f18]">
      <Link href={href}>{label}</Link>
    </Button>
  );
}

function StoryTile({
  article,
  compact = false,
  image,
}: {
  article: EditorialStory;
  compact?: boolean;
  image?: string | null;
}) {
  const [imageVisible, setImageVisible] = useState(Boolean(image));

  useEffect(() => {
    setImageVisible(Boolean(image));
  }, [image]);

  return (
    <StoryAnchor
      href={article.href ?? `/articles/${article.slug}`}
      isExternal={article.isExternal}
      className="block rounded-xl border border-[var(--border)] bg-white px-4 py-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.06)]"
    >
      <div className={compact ? "flex gap-4" : ""}>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">{article.category}</div>
          <h3 className={compact ? "mt-2 font-serif text-xl leading-tight" : "mt-2 font-serif text-2xl leading-tight"}>
            {article.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{article.summary}</p>
          <div className="mt-3 text-sm text-[var(--muted-foreground)]">
            {article.author.name} | {formatRelativeTime(article.publishedAt)}
          </div>
        </div>
        {compact && image && imageVisible ? (
          <div className="relative hidden h-24 w-28 shrink-0 overflow-hidden rounded-lg md:block">
            <SafeNewsImage
              src={image}
              alt={article.featuredImageAlt ?? article.title}
              sizes="112px"
              className="object-cover"
              onVisibilityChange={setImageVisible}
            />
          </div>
        ) : null}
      </div>
    </StoryAnchor>
  );
}

function LatestSidebar({ items }: { items: LatestSidebarItem[] }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-[1.7rem] leading-tight text-[var(--foreground)]">Latest News</h2>
          <div className="mt-2 h-0.5 w-12 bg-[#D8261D]" />
        </div>
        <Link href="/latest" className="text-sm font-medium text-[var(--accent)] underline underline-offset-4">
          View all
        </Link>
      </div>

      <div className="flex-1 space-y-1.5">
        {items.slice(0, 8).map((item) => (
          <StoryAnchor
            key={item.id}
            href={item.href}
            isExternal={item.isExternal}
            className="flex items-start gap-3 border-t border-[var(--border)] pt-2 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.13em]">
                <span className="font-semibold text-[#D8261D]">{formatRelativeTime(item.publishedAt)}</span>
                <span className="text-slate-400">|</span>
                <span className="text-[var(--accent)]">{item.category}</span>
              </div>
              <div className="mt-1 text-[0.98rem] font-medium leading-6 text-[var(--foreground)]">{item.headline}</div>
            </div>
            <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          </StoryAnchor>
        ))}
      </div>

      <Button asChild variant="outline" className="mt-4 w-full">
        <Link href="/latest">View More Latest News</Link>
      </Button>
    </div>
  );
}

function LeadHeroCard({ article }: { article: EditorialStory }) {
  const heroImage = article.featuredImageUrl ?? null;
  const [heroVisible, setHeroVisible] = useState(Boolean(heroImage));

  useEffect(() => {
    setHeroVisible(Boolean(heroImage));
  }, [heroImage]);

  const hasHeroImage = Boolean(heroImage) && heroVisible;

  return (
    <StoryAnchor
      href={article.href ?? `/articles/${article.slug}`}
      isExternal={article.isExternal}
      className="group block overflow-hidden rounded-2xl border border-[color:rgba(15,23,42,0.12)] shadow-[0_24px_48px_rgba(15,23,42,0.11)]"
    >
      <div className={hasHeroImage ? "relative min-h-[392px] sm:min-h-[432px] lg:min-h-[468px]" : "bg-white p-5 sm:p-7 lg:p-8"}>
        {hasHeroImage ? (
          <>
            <SafeNewsImage
              src={heroImage}
              alt={article.featuredImageAlt ?? article.title}
              priority
              quality={100}
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 100vw, 900px"
              className="object-cover object-[center_34%]"
              onVisibilityChange={setHeroVisible}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,18,0.9)_0%,rgba(5,10,18,0.6)_38%,rgba(5,10,18,0.22)_72%,rgba(5,10,18,0.14)_100%)]" />
          </>
        ) : null}
        <div className={hasHeroImage ? "absolute inset-0 flex items-end p-5 sm:p-7 lg:p-8" : "flex items-end"}>
          <div className={hasHeroImage ? "max-w-[640px] text-white" : "max-w-[760px]"}>
            <Badge className="border-0 bg-[#D8261D] text-white shadow-none">{article.category}</Badge>
            <h1 className="mt-4 max-w-[660px] font-serif text-[clamp(33px,3vw,45px)] leading-[1.12] tracking-[-0.02em]">
              {article.title}
            </h1>
            <p className={hasHeroImage ? "mt-4 max-w-[36rem] text-sm leading-7 text-white/82 sm:text-base" : "mt-4 max-w-[42rem] text-sm leading-7 text-[var(--muted-foreground)] sm:text-base"}>
              {article.summary}
            </p>
            <div className={hasHeroImage ? "mt-5 text-sm text-white/78" : "mt-5 text-sm text-[var(--muted-foreground)]"}>
              {formatRelativeTime(article.publishedAt)}
            </div>
            <div className="mt-5">
              <ButtonStoryLink
                href={article.href ?? `/articles/${article.slug}`}
                isExternal={article.isExternal}
                label="Read Full Story"
              />
            </div>
          </div>
        </div>
      </div>
    </StoryAnchor>
  );
}

function TopStoryCard({ story }: { story: SectionStory }) {
  const [imageVisible, setImageVisible] = useState(Boolean(story.image));

  useEffect(() => {
    setImageVisible(Boolean(story.image));
  }, [story.image]);

  if (!story.image || !imageVisible) {
    return (
      <StoryAnchor
        href={story.href}
        isExternal={story.isExternal}
        className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.06)]"
      >
        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">{story.category}</div>
        <div className="mt-2 font-serif text-[1.18rem] leading-[1.18] text-[var(--foreground)]">{story.title}</div>
        <div className="mt-3 text-sm text-[var(--muted-foreground)]">{story.time}</div>
      </StoryAnchor>
    );
  }

  return (
    <StoryAnchor
      href={story.href}
      isExternal={story.isExternal}
      className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.06)]"
    >
      <div className="relative h-48">
        {story.image ? (
          <SafeNewsImage
            src={story.image}
            alt={story.title}
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            onVisibilityChange={setImageVisible}
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,#081221,#17263d)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-3.5">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/80">{story.category}</div>
          <div className="mt-1.5 font-serif text-[1.08rem] leading-[1.08] sm:text-[1.1rem]">{story.title}</div>
          <div className="mt-1 text-[13px] text-white/78">{story.time}</div>
        </div>
      </div>
    </StoryAnchor>
  );
}

function SectionPanel({
  title,
  featured,
  stories,
}: {
  title: string;
  featured: SectionStory;
  stories: SectionStory[];
}) {
  const [featuredVisible, setFeaturedVisible] = useState(Boolean(featured.image));

  useEffect(() => {
    setFeaturedVisible(Boolean(featured.image));
  }, [featured.image]);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 rounded-full bg-[#D8261D]" />
          <h2 className="text-lg font-semibold uppercase tracking-[0.06em]">{title}</h2>
        </div>
        <Link href="/latest" className="text-sm text-[var(--accent)] underline underline-offset-4">
          View all
        </Link>
      </div>

      <StoryAnchor href={featured.href} isExternal={featured.isExternal} className="block overflow-hidden rounded-xl border border-[var(--border)]">
        {featured.image && featuredVisible ? (
          <>
            <div className="relative h-56">
              <SafeNewsImage
                src={featured.image}
                alt={featured.title}
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
                onVisibilityChange={setFeaturedVisible}
              />
            </div>
            <div className="space-y-2 bg-white p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">{featured.category}</div>
              <div className="font-serif text-[1.5rem] leading-tight">{featured.title}</div>
              <div className="text-sm text-[var(--muted-foreground)]">{featured.time}</div>
            </div>
          </>
        ) : (
          <div className="space-y-2 bg-white p-4 sm:p-5">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">{featured.category}</div>
            <div className="font-serif text-[1.5rem] leading-tight">{featured.title}</div>
            <div className="text-sm text-[var(--muted-foreground)]">{featured.time}</div>
          </div>
        )}
      </StoryAnchor>

      <div className="mt-4 space-y-3">
        {stories.slice(0, 2).map((story) => (
          <StoryAnchor
            key={story.title}
            href={story.href}
            isExternal={story.isExternal}
            className="flex items-start gap-3 border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">{story.category}</div>
              <div className="mt-1 text-[1rem] leading-6 text-[var(--foreground)]">{story.title}</div>
              <div className="mt-1 text-sm text-[var(--muted-foreground)]">{story.time}</div>
            </div>
            {story.image ? (
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md">
                <SafeNewsImage src={story.image} alt={story.title} sizes="80px" className="object-cover" />
              </div>
            ) : null}
          </StoryAnchor>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">{label}</div>
        <h2 className="mt-2 font-serif text-4xl leading-tight">{title}</h2>
      </div>
      <Link href={href} className="text-sm text-[var(--muted-foreground)] underline underline-offset-4">
        View all
      </Link>
    </div>
  );
}

export function HomepageClient({
  initialNewsResponse,
  refreshIntervalMinutes,
  personalized,
}: {
  initialNewsResponse: HomepageNewsApiResponse;
  refreshIntervalMinutes: number;
  personalized: PersonalizedHomepage | null;
}) {
  const [newsResponse, setNewsResponse] = useState(initialNewsResponse);
  const [pendingNewsResponse, setPendingNewsResponse] = useState<HomepageNewsApiResponse | null>(null);
  const newsletterSummary = summarizeNewsletterPreferences(personalized?.newsletterPreferences ?? {});
  const notificationSummary = summarizeNotificationPreferences(personalized?.notificationPreferences ?? {});
  const bundle: HomepageNewsBundle = newsResponse.bundle;
  const displayedStoryIds = new Set<string>();
  const usedImages: string[] = [];

  const assignHomepageStoryImage = (article: EditorialStory, options?: { preferPremium?: boolean }) => {
    if (displayedStoryIds.has(article.id)) {
      return null;
    }

    displayedStoryIds.add(article.id);

    const nextImage = resolveStoryImage(article, {
      usedImages,
      preferPremium: options?.preferPremium,
      minimumScore: options?.preferPremium ? 28 : 24,
    });

    if (nextImage && usedImages.includes(nextImage)) {
      return null;
    }

    if (nextImage) {
      usedImages.push(nextImage);
    }

    return nextImage;
  };

  const heroStoryImage = assignHomepageStoryImage(bundle.heroStory, { preferPremium: true });

  useEffect(() => {
    setNewsResponse(initialNewsResponse);
  }, [initialNewsResponse]);

  useEffect(() => {
    if (refreshIntervalMinutes <= 0) {
      return;
    }

    let cancelled = false;

    const checkForUpdates = async () => {
      try {
        const response = await fetch("/api/rest/news/homepage", {
          cache: "no-store",
        });

        if (!response.ok || cancelled) {
          return;
        }

        const nextResponse = (await response.json()) as HomepageNewsApiResponse;
        if (nextResponse.lastUpdated !== newsResponse.lastUpdated) {
          setPendingNewsResponse(nextResponse);
        }
      } catch {
        // Silent failure keeps the current homepage snapshot visible.
      }
    };

    const intervalId = window.setInterval(() => {
      void checkForUpdates();
    }, refreshIntervalMinutes * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [newsResponse.lastUpdated, refreshIntervalMinutes]);

  const topStoryCards: SectionStory[] = bundle.topStories
    .slice(0, 4)
    .map((article) => toSectionStory(article, assignHomepageStoryImage(article)));
  const trendingStories = selectTrendingStories(
    [
      bundle.heroStory,
      ...bundle.topStories,
      ...bundle.worldNews,
      ...bundle.businessNews,
      ...bundle.technologyNews,
      ...bundle.sportsNews,
      ...bundle.liveCoverage,
      ...bundle.mostRead,
    ].map(toRecommendationStory),
    5,
  );

  const sectionPanels = [
    {
      title: "World News",
      featured: toSectionStory(bundle.worldNews[0] ?? bundle.heroStory, assignHomepageStoryImage(bundle.worldNews[0] ?? bundle.heroStory)),
      stories: bundle.worldNews.slice(1, 3).map((article) => toSectionStory(article, assignHomepageStoryImage(article))),
    },
    {
      title: "Business",
      featured: toSectionStory(bundle.businessNews[0] ?? bundle.heroStory, assignHomepageStoryImage(bundle.businessNews[0] ?? bundle.heroStory)),
      stories: bundle.businessNews.slice(1, 3).map((article) => toSectionStory(article, assignHomepageStoryImage(article))),
    },
    {
      title: "Technology",
      featured: toSectionStory(bundle.technologyNews[0] ?? bundle.heroStory, assignHomepageStoryImage(bundle.technologyNews[0] ?? bundle.heroStory)),
      stories: bundle.technologyNews.slice(1, 3).map((article) => toSectionStory(article, assignHomepageStoryImage(article))),
    },
    {
      title: "Sports",
      featured: toSectionStory(bundle.sportsNews[0] ?? bundle.heroStory, assignHomepageStoryImage(bundle.sportsNews[0] ?? bundle.heroStory)),
      stories: bundle.sportsNews.slice(1, 3).map((article) => toSectionStory(article, assignHomepageStoryImage(article))),
    },
  ];
  const liveLeadStory = bundle.liveCoverage[0] ?? null;
  const liveLeadImage = liveLeadStory ? assignHomepageStoryImage(liveLeadStory, { preferPremium: true }) : null;
  const liveDevelopmentStories = bundle.liveCoverage.slice(1).map((story) => ({
    story,
    image: assignHomepageStoryImage(story),
  }));
  const opinionStories = bundle.opinion.map((story) => ({
    story,
    image: assignHomepageStoryImage(story),
  }));
  const mostReadStories = bundle.mostRead.slice(0, 6).map((story) => ({
    story,
    image: assignHomepageStoryImage(story),
  }));

  return (
    <main className="bg-[#F8F8F8] pb-16">
      <div className="sr-only">VANTERENPRESS homepage</div>
      {pendingNewsResponse ? (
        <section className="border-b border-[var(--border)] bg-white/95">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 text-sm sm:px-6 lg:px-8">
            <div className="font-medium text-[var(--foreground)]">
              New stories available.
            </div>
            <button
              type="button"
              onClick={() => {
                setNewsResponse(pendingNewsResponse);
                setPendingNewsResponse(null);
              }}
              className="rounded-full bg-[#D8261D] px-4 py-2 font-semibold text-white transition hover:bg-[#bf1f18]"
            >
              Refresh
            </button>
          </div>
        </section>
      ) : null}
      <section className="border-b border-[var(--border)] bg-[#F8F8F8]">
        <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,68fr)_minmax(320px,32fr)] xl:grid-cols-[minmax(0,70fr)_minmax(330px,30fr)] xl:gap-5">
            <MotionDiv initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <LeadHeroCard article={{ ...bundle.heroStory, featuredImageUrl: heroStoryImage }} />
            </MotionDiv>
            <MotionDiv
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              <LatestSidebar items={bundle.latestSidebar} />
            </MotionDiv>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-[#D8261D]" />
          <h2 className="text-xl font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">Top Stories</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {topStoryCards.map((story) => (
            <TopStoryCard key={story.title} story={story} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 pb-6 sm:px-6 lg:px-8">
        <TrendingNow
          items={trendingStories.map((story) => ({
            id: story.id,
            href: story.href ?? `/articles/${story.slug}`,
            title: story.title,
            category: story.category,
            isExternal: story.isExternal,
          }))}
        />
      </section>

      <section className="mx-auto max-w-[1480px] px-4 pb-7 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {sectionPanels.map((panel) => (
            <SectionPanel
              key={panel.title}
              title={panel.title}
              featured={panel.featured}
              stories={panel.stories}
            />
          ))}
        </div>
      </section>

      {personalized ? (
        <section className="mx-auto max-w-[1480px] px-4 pb-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-[var(--accent)]">
              <CardHeader>
                <CardTitle>Continue Reading</CardTitle>
                <CardDescription>Saved and recently viewed journalism from your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {personalized.continueReading.length
                  ? personalized.continueReading.map((story) => (
                      <Link key={story.id} href={`/articles/${story.slug}`} className="block rounded-[24px] border border-[var(--border)] px-5 py-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{story.categories[0]?.category.name ?? story.articleType}</div>
                        <div className="mt-2 font-serif text-2xl leading-tight">{story.title}</div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{story.excerpt}</p>
                      </Link>
                    ))
                  : <div className="rounded-[24px] bg-[var(--muted)] p-5 text-sm text-[var(--muted-foreground)]">Your saved and recently read stories will appear here.</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
                <CardDescription>Built from followed authors, saved stories, and reading patterns.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {personalized.recommended.length
                  ? personalized.recommended.slice(0, 3).map((story) => (
                      <Link key={story.id} href={`/articles/${story.slug}`} className="block rounded-[24px] border border-[var(--border)] px-5 py-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{story.categories[0]?.category.name ?? story.articleType}</div>
                        <div className="mt-2 font-serif text-2xl leading-tight">{story.title}</div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{story.excerpt}</p>
                      </Link>
                    ))
                  : <div className="rounded-[24px] bg-[var(--muted)] p-5 text-sm text-[var(--muted-foreground)]">Recommendations will populate as your reading profile grows.</div>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
                    <div className="font-medium text-[var(--foreground)]">Newsletter Preferences</div>
                    <div className="mt-2">{newsletterSummary.topics.length ? newsletterSummary.topics.slice(0, 3).join(", ") : "Choose regions and topics from your account."}</div>
                  </div>
                  <div className="rounded-[24px] bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
                    <div className="font-medium text-[var(--foreground)]">Alert Settings</div>
                    <div className="mt-2">Breaking alerts {notificationSummary.breakingNews ? "enabled" : "muted"} | Email {notificationSummary.email ? "on" : "off"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8">
        <SectionHeader title="Live Coverage" href="/live" label="Developing Story" />
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-[var(--accent)]">
            <CardHeader>
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <RadioTower className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Live</span>
              </div>
              <CardTitle className="font-serif text-[1.75rem] leading-tight">{liveLeadStory?.title}</CardTitle>
              <CardDescription>{liveLeadStory?.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-[var(--muted-foreground)]">
              {liveLeadStory && liveLeadImage ? (
                <ConditionalNewsImage
                  src={liveLeadImage}
                  alt={liveLeadStory.featuredImageAlt ?? liveLeadStory.title}
                  sizes="(max-width: 1024px) 100vw, 540px"
                  containerClassName="relative h-44 overflow-hidden rounded-xl border border-[var(--border)]"
                  imageClassName="object-cover"
                />
              ) : null}
              {liveLeadStory?.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <ButtonStoryLink
                href={liveLeadStory?.href ?? "/live"}
                isExternal={liveLeadStory?.isExternal}
                label="Open live coverage"
              />
            </CardContent>
          </Card>
            <Card>
              <CardHeader>
                <CardTitle>Live Developments</CardTitle>
                <CardDescription>What editors are tracking right now.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {liveDevelopmentStories.map(({ story, image }) => (
                  <StoryAnchor
                    key={story.id}
                    href={story.href ?? `/articles/${story.slug}`}
                    isExternal={story.isExternal}
                    className="grid grid-cols-[10px_1fr_84px] items-center gap-3 rounded-[24px] bg-[var(--muted)] p-4"
                  >
                    <div className="flex h-full justify-center">
                      <span className="block h-full min-h-12 w-[2px] rounded-full bg-[var(--accent)]" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{formatClock(story.publishedAt)}</div>
                      <div className="mt-2 text-lg leading-7">{story.title}</div>
                    </div>
                    {image ? (
                      <ConditionalNewsImage
                        src={image}
                        alt={story.featuredImageAlt ?? story.title}
                        sizes="84px"
                        containerClassName="relative h-16 overflow-hidden rounded-lg"
                        imageClassName="object-cover"
                      />
                    ) : (
                      <div className="text-right text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Live</div>
                    )}
                  </StoryAnchor>
                ))}
              </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8">
        <SectionHeader title="Latest Opinion" href="/search?articleType=OPINION" label="Commentary" />
        <div className="grid gap-5 lg:grid-cols-2">
          {opinionStories.map(({ story, image }) => (
            <Link
              key={story.id}
              href={story.href ?? `/articles/${story.slug}`}
              className="grid gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 md:grid-cols-[1fr_212px]"
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">{story.category}</div>
                <h3 className="mt-2 font-serif text-[1.15rem] leading-[1.25] text-[var(--foreground)]">{story.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{story.summary}</p>
                <div className="mt-4 text-sm text-[var(--muted-foreground)]">
                  {story.author.name} | {formatRelativeTime(story.publishedAt)}
                </div>
              </div>
              {image ? (
                <ConditionalNewsImage
                  src={image}
                  alt={story.featuredImageAlt ?? story.title}
                  sizes="220px"
                  containerClassName="relative h-44 overflow-hidden rounded-xl md:h-full"
                  imageClassName="object-cover"
                />
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8">
        <SectionHeader title="Most Read" href="/most-read" label="Reader Demand" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {mostReadStories.map(({ story, image }) => (
            <StoryTile key={story.id} article={story} compact image={image} />
          ))}
        </div>
      </section>
    </main>
  );
}

import { isDatabaseAvailable } from "@/lib/database-availability";
import {
  applyHomepageHeroSelection,
  HOMEPAGE_HERO_MAX_ITEMS,
  selectActiveHomepageHeroArticles,
  toEditorialStoryFromArticle,
} from "@/lib/homepage-hero";
import { prisma } from "@/lib/prisma";
import { CurrentsNewsProvider } from "@/lib/news-providers/currents-provider";
import { FinanceNewsProvider } from "@/lib/news-providers/finance-provider";
import { GNewsProvider } from "@/lib/news-providers/gnews-provider";
import { GuardianNewsProvider } from "@/lib/news-providers/guardian-provider";
import { NewsApiProvider } from "@/lib/news-providers/newsapi-provider";
import { cleanNewsText } from "@/lib/news-providers/clean-news-text";
import { normalizeLiveStory } from "@/lib/news-providers/normalize-live-story";
import { RssNewsProvider } from "@/lib/news-providers/rss-provider";
import {
  getSeedHomepageBundle,
  getSeedStoryBySlug,
  seededEditorialStories,
} from "@/lib/news-providers/seed-content";
import { TheNewsApiProvider } from "@/lib/news-providers/the-news-provider";
import type {
  EditorialStory,
  HomepageNewsApiResponse,
  HomepageNewsBundle,
  NewsMode,
  NewsProvider,
  ProviderRuntimeStatus,
} from "@/lib/news-providers/types";
import { normalizeSlug } from "@/lib/utils";

export const HOMEPAGE_NEWS_STATE_KEY = "news.homepage.snapshot";
const DEFAULT_REFRESH_INTERVAL_MINUTES = 15;

type ProviderKey = "gnews" | "newsapi";

type SchedulerGlobal = typeof globalThis & {
  __homepageNewsRefreshInterval?: NodeJS.Timeout;
  __homepageNewsRefreshPromise?: Promise<HomepageNewsApiResponse> | null;
  __homepageNewsLastResponse?: HomepageNewsApiResponse | null;
};

const schedulerGlobal = globalThis as SchedulerGlobal;

function sortNewest(stories: EditorialStory[]) {
  return [...stories].sort(
    (left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
  );
}

function uniqueStories(stories: EditorialStory[]) {
  const seen = new Set<string>();
  return stories.filter((story) => {
    const key = story.sourceUrl ?? story.slug;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function categoryMatcher(input: RegExp | string[]) {
  if (input instanceof RegExp) {
    return (story: EditorialStory) => input.test(`${story.category} ${story.desk ?? ""} ${story.tags.join(" ")}`);
  }

  const lowered = input.map((entry) => entry.toLowerCase());
  return (story: EditorialStory) => {
    const haystack = `${story.category} ${story.desk ?? ""} ${story.tags.join(" ")}`.toLowerCase();
    return lowered.some((entry) => haystack.includes(entry));
  };
}

function pickStories(stories: EditorialStory[], matcher: RegExp | string[], count: number) {
  return uniqueStories(sortNewest(stories).filter(categoryMatcher(matcher))).slice(0, count);
}

function ensureCount(primary: EditorialStory[], fallback: EditorialStory[], count: number) {
  const byId = new Map<string, EditorialStory>();
  [...primary, ...fallback].forEach((story) => {
    if (!byId.has(story.id)) {
      byId.set(story.id, story);
    }
  });

  return [...byId.values()].slice(0, count);
}

function buildLatestSidebar(stories: EditorialStory[]) {
  return stories.map((story) => ({
    id: story.id,
    headline: cleanNewsText(story.title),
    category: cleanNewsText(story.category),
    publishedAt: story.publishedAt,
    href: story.href ?? `/articles/${story.slug}`,
    isExternal: story.isExternal,
  }));
}

function flattenBundleStories(bundle: HomepageNewsBundle) {
  return uniqueStories([
    bundle.heroStory,
    ...bundle.topStories,
    ...bundle.worldNews,
    ...bundle.businessNews,
    ...bundle.technologyNews,
    ...bundle.sportsNews,
    ...bundle.liveCoverage,
    ...bundle.opinion,
    ...bundle.mostRead,
  ]);
}

function normalizeHomepageBundle(bundle: HomepageNewsBundle): HomepageNewsBundle {
  return {
    ...bundle,
    breakingBanners: bundle.breakingBanners.map((banner) => ({
      ...banner,
      title: cleanNewsText(banner.title),
      summary: cleanNewsText(banner.summary),
    })),
    heroStory: normalizeLiveStory(bundle.heroStory),
    latestSidebar: bundle.latestSidebar.map((item) => ({
      ...item,
      headline: cleanNewsText(item.headline),
      category: cleanNewsText(item.category),
    })),
    topStories: bundle.topStories.map((story) => normalizeLiveStory(story)),
    worldNews: bundle.worldNews.map((story) => normalizeLiveStory(story)),
    businessNews: bundle.businessNews.map((story) => normalizeLiveStory(story)),
    technologyNews: bundle.technologyNews.map((story) => normalizeLiveStory(story)),
    sportsNews: bundle.sportsNews.map((story) => normalizeLiveStory(story)),
    liveCoverage: bundle.liveCoverage.map((story) => normalizeLiveStory(story)),
    opinion: bundle.opinion.map((story) => normalizeLiveStory(story)),
    mostRead: bundle.mostRead.map((story) => normalizeLiveStory(story)),
  };
}

function isCmsStoryVisible(story: EditorialStory, visibleCmsStoryIds: Set<string>) {
  return story.provider !== "cms" || visibleCmsStoryIds.has(story.id);
}

function filterHomepageBundleToVisibleStories(bundle: HomepageNewsBundle, visibleCmsStoryIds: Set<string>) {
  const nextHeroStory = isCmsStoryVisible(bundle.heroStory, visibleCmsStoryIds)
    ? bundle.heroStory
    : null;
  const firstVisibleStory = [
    ...bundle.topStories,
    ...bundle.worldNews,
    ...bundle.businessNews,
    ...bundle.technologyNews,
    ...bundle.sportsNews,
    ...bundle.liveCoverage,
    ...bundle.opinion,
    ...bundle.mostRead,
  ].find((story) => isCmsStoryVisible(story, visibleCmsStoryIds));

  return {
    ...bundle,
    heroStory: nextHeroStory ?? firstVisibleStory ?? bundle.heroStory,
    topStories: bundle.topStories.filter((story) => isCmsStoryVisible(story, visibleCmsStoryIds)),
    worldNews: bundle.worldNews.filter((story) => isCmsStoryVisible(story, visibleCmsStoryIds)),
    businessNews: bundle.businessNews.filter((story) => isCmsStoryVisible(story, visibleCmsStoryIds)),
    technologyNews: bundle.technologyNews.filter((story) => isCmsStoryVisible(story, visibleCmsStoryIds)),
    sportsNews: bundle.sportsNews.filter((story) => isCmsStoryVisible(story, visibleCmsStoryIds)),
    liveCoverage: bundle.liveCoverage.filter((story) => isCmsStoryVisible(story, visibleCmsStoryIds)),
    opinion: bundle.opinion.filter((story) => isCmsStoryVisible(story, visibleCmsStoryIds)),
    mostRead: bundle.mostRead.filter((story) => isCmsStoryVisible(story, visibleCmsStoryIds)),
    latestSidebar: bundle.latestSidebar,
  } satisfies HomepageNewsBundle;
}

async function getHomepageHeroOverrides() {
  if (!await isDatabaseAvailable()) {
    return { manualHero: null, fallbackHero: null, heroCarouselStories: [] as EditorialStory[], visibleCmsStoryIds: new Set<string>() };
  }

  const articleInclude = {
    author: { select: { name: true, email: true } },
    edition: { select: { name: true, region: true } },
    categories: { include: { category: { select: { name: true } } } },
    tags: { include: { tag: { select: { name: true } } } },
    media: {
      select: {
        url: true,
        thumbnailUrl: true,
        altText: true,
      },
      orderBy: { createdAt: "desc" as const },
    },
  } as const;

  try {
    const [fallbackHeroArticle, carouselArticles, visibleCmsArticles] = await Promise.all([
      prisma.article.findFirst({
        where: { status: "PUBLISHED", deletedAt: null },
        include: articleInclude,
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.article.findMany({
        where: { status: "PUBLISHED", deletedAt: null, showOnHero: true },
        include: articleInclude,
        orderBy: [
          { heroPriority: "desc" },
          { heroStartAt: "asc" },
          { publishedAt: "desc" },
          { updatedAt: "desc" },
        ],
        take: HOMEPAGE_HERO_MAX_ITEMS * 3,
      }),
      prisma.article.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        select: { id: true },
      }),
    ]);

    const activeHeroArticles = selectActiveHomepageHeroArticles(carouselArticles);

    const manualHeroArticle = activeHeroArticles[0] ?? null;

    return {
      manualHero: manualHeroArticle ? toEditorialStoryFromArticle(manualHeroArticle) : null,
      fallbackHero: fallbackHeroArticle ? toEditorialStoryFromArticle(fallbackHeroArticle) : null,
      heroCarouselStories: activeHeroArticles.map(toEditorialStoryFromArticle),
      visibleCmsStoryIds: new Set(visibleCmsArticles.map((article) => article.id)),
    };
  } catch {
    return { manualHero: null, fallbackHero: null, heroCarouselStories: [] as EditorialStory[], visibleCmsStoryIds: new Set<string>() };
  }
}

function getSeedLatestFallbackStories() {
  return [
    "spacex-ipo-speculation-grows-as-private-market-demand-accelerates",
    "fifa-world-cup-2026-preparations-intensify-across-host-cities",
    "spain-held-to-draw-in-opening-world-cup-campaign",
    "brazil-and-morocco-share-points-in-competitive-world-cup-clash",
    "oil-prices-fluctuate-amid-uncertainty-over-supply-routes-and-demand-outlook",
    "global-markets-react-to-economic-data-as-traders-reprice-growth-expectations",
    "ai-investment-accelerates-as-infrastructure-spending-spreads-beyond-model-labs",
    "middle-east-live-updates-aid-access-ceasefire-monitoring-and-regional-diplomacy",
  ]
    .map((slug) => getSeedStoryBySlug(slug))
    .filter((story): story is EditorialStory => Boolean(story));
}

export function getNewsMode(): NewsMode {
  return process.env.NEWS_MODE === "live" ? "live" : "seed";
}

export function getNewsRefreshIntervalMinutes() {
  const parsed = Number(process.env.NEWS_REFRESH_INTERVAL_MINUTES ?? `${DEFAULT_REFRESH_INTERVAL_MINUTES}`);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REFRESH_INTERVAL_MINUTES;
}

export function getNewsRefreshIntervalMs() {
  return getNewsRefreshIntervalMinutes() * 60 * 1000;
}

function getRefreshStatusTemplate(lastUpdated: string, mode: NewsMode, providerErrors: string[]) {
  return {
    lastUpdated,
    lastSuccessfulLiveRefresh: mode === "live" ? null : null,
    nextScheduledRefresh: mode === "live" ? new Date(Date.now() + getNewsRefreshIntervalMs()).toISOString() : null,
    providerErrors,
    activeNewsMode: mode,
    refreshIntervalMinutes: getNewsRefreshIntervalMinutes(),
    cacheTtlMinutes: getNewsRefreshIntervalMinutes(),
  };
}

function buildSeedResponse(): HomepageNewsApiResponse {
  const bundle = getSeedHomepageBundle();
  const lastUpdated = bundle.heroStory.publishedAt;
  const gnewsConfigured = new GNewsProvider().isConfigured();
  const newsApiConfigured = new NewsApiProvider().isConfigured();

  return {
    bundle,
    lastUpdated,
    source: "seed",
    providerStatus: {
      gnews: {
        name: "GNews",
        configured: gnewsConfigured,
        status: gnewsConfigured ? "idle" : "skipped",
        lastAttemptedAt: null,
        lastSuccessAt: null,
        lastError: null,
        articleCount: 0,
      },
      newsapi: {
        name: "NewsAPI",
        configured: newsApiConfigured,
        status: newsApiConfigured ? "idle" : "skipped",
        lastAttemptedAt: null,
        lastSuccessAt: null,
        lastError: null,
        articleCount: 0,
      },
    },
    status: getRefreshStatusTemplate(lastUpdated, "seed", []),
  };
}

function getSupplementalProviders(): NewsProvider[] {
  return [
    new RssNewsProvider(),
    new GuardianNewsProvider(),
    new CurrentsNewsProvider(),
    new TheNewsApiProvider(),
    new FinanceNewsProvider(),
  ];
}

function getTrackedProviders(): Record<ProviderKey, NewsProvider> {
  return {
    gnews: new GNewsProvider(),
    newsapi: new NewsApiProvider(),
  };
}

export function buildLiveHomepageBundle(providerStories: EditorialStory[]): HomepageNewsBundle {
  const normalizedStories = providerStories.map((story) => normalizeLiveStory(story));
  const seed = getSeedHomepageBundle();
  const liveWorld = pickStories(normalizedStories, ["world", "international", "politics", "diplomacy", "climate"], 4);
  const liveBusiness = pickStories(normalizedStories, ["business", "finance", "markets", "economy", "energy", "crypto"], 4);
  const liveTechnology = pickStories(normalizedStories, ["technology", "tech", "ai", "cyber", "infrastructure"], 4);
  const liveSports = pickStories(normalizedStories, ["sports", "football", "soccer", "world cup"], 3);
  const liveOpinion = pickStories(normalizedStories, ["opinion", "analysis"], 2);
  const liveGeneral = sortNewest(normalizedStories);
  const latestStories = ensureCount(liveGeneral, getSeedLatestFallbackStories(), 8);

  return {
    ...normalizeHomepageBundle(seed),
    mode: "live",
    latestSidebar: buildLatestSidebar(latestStories),
    topStories: ensureCount(
      [
        ...pickStories(normalizedStories, ["world", "business", "technology", "general", "markets"], 6),
        seed.heroStory,
      ],
      seed.topStories,
      6,
    ),
    worldNews: ensureCount(liveWorld, seed.worldNews, 4),
    businessNews: ensureCount(liveBusiness, seed.businessNews, 4),
    technologyNews: ensureCount(liveTechnology, seed.technologyNews, 4),
    sportsNews: ensureCount(liveSports, seed.sportsNews, 3),
    liveCoverage: ensureCount(
      pickStories(normalizedStories, ["live", "world", "general", "politics", "ceasefire"], 3),
      seed.liveCoverage,
      3,
    ),
    opinion: ensureCount(liveOpinion, seed.opinion, 2),
    mostRead: ensureCount(liveGeneral, seed.mostRead, 6),
    breakingBanners: ensureCount(
      liveGeneral.filter((story) => story.isBreaking),
      seed.breakingBanners.map((banner) => {
        const story = seededEditorialStories.find((item) => banner.linkUrl.includes(item.slug));
        return story ?? seed.heroStory;
      }),
      3,
    ).map((story, index) => ({
      id: `live-breaking-${index}`,
      title: story.title,
      summary: story.summary,
      linkUrl: story.href ?? `/articles/${story.slug}`,
    })),
  };
}

function createProviderStatus(
  name: string,
  configured: boolean,
  overrides: Partial<ProviderRuntimeStatus> = {},
): ProviderRuntimeStatus {
  return {
    name,
    configured,
    status: configured ? "idle" : "skipped",
    lastAttemptedAt: null,
    lastSuccessAt: null,
    lastError: null,
    articleCount: 0,
    ...overrides,
  };
}

async function readPersistedHomepageNews(): Promise<HomepageNewsApiResponse | null> {
  if (!await isDatabaseAvailable()) {
    return schedulerGlobal.__homepageNewsLastResponse ?? null;
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: HOMEPAGE_NEWS_STATE_KEY },
    });

    if (!setting?.value || typeof setting.value !== "object") {
      return null;
    }

    const value = setting.value as HomepageNewsApiResponse;
    if (value?.bundle) {
      schedulerGlobal.__homepageNewsLastResponse = value;
      return {
        ...value,
        bundle: normalizeHomepageBundle(value.bundle),
      };
    }

    return schedulerGlobal.__homepageNewsLastResponse ?? null;
  } catch {
    return schedulerGlobal.__homepageNewsLastResponse ?? null;
  }
}

async function persistHomepageNews(response: HomepageNewsApiResponse) {
  schedulerGlobal.__homepageNewsLastResponse = response;

  if (!await isDatabaseAvailable()) {
    return;
  }

  try {
    await prisma.siteSetting.upsert({
      where: { key: HOMEPAGE_NEWS_STATE_KEY },
      update: { value: response },
      create: { key: HOMEPAGE_NEWS_STATE_KEY, value: response },
    });
  } catch {
    // Snapshot persistence is optional when the database is unavailable.
  }
}

export function resetHomepageNewsInMemoryCache() {
  if (schedulerGlobal.__homepageNewsRefreshInterval) {
    clearInterval(schedulerGlobal.__homepageNewsRefreshInterval);
    schedulerGlobal.__homepageNewsRefreshInterval = undefined;
  }
  schedulerGlobal.__homepageNewsRefreshPromise = null;
  schedulerGlobal.__homepageNewsLastResponse = null;
}

function isRefreshDue(response: HomepageNewsApiResponse) {
  const nextScheduledRefresh = response.status.nextScheduledRefresh;
  return !nextScheduledRefresh || new Date(nextScheduledRefresh).getTime() <= Date.now();
}

function normalizeProviderErrors(providerStatus: HomepageNewsApiResponse["providerStatus"]) {
  return Object.values(providerStatus)
    .filter((provider) => provider.lastError)
    .map((provider) => `${provider.name}: ${provider.lastError}`);
}

export async function refreshHomepageNews(reason = "scheduled"): Promise<HomepageNewsApiResponse> {
  if (schedulerGlobal.__homepageNewsRefreshPromise) {
    return schedulerGlobal.__homepageNewsRefreshPromise;
  }

  schedulerGlobal.__homepageNewsRefreshPromise = (async () => {
    try {
      const mode = getNewsMode();
      if (mode !== "live") {
        const seedResponse = buildSeedResponse();
        schedulerGlobal.__homepageNewsLastResponse = seedResponse;
        return seedResponse;
      }

      const previous = (await readPersistedHomepageNews()) ?? schedulerGlobal.__homepageNewsLastResponse ?? null;
      const trackedProviders = getTrackedProviders();
      const supplementalProviders = getSupplementalProviders();
      const trackedEntries = Object.entries(trackedProviders) as Array<[ProviderKey, NewsProvider]>;
      const configuredTrackedEntries = trackedEntries.filter(([, provider]) => provider.isConfigured());
      const configuredSupplementals = supplementalProviders.filter((provider) => provider.isConfigured());
      const attemptTimestamp = new Date().toISOString();

      const providerStatus: HomepageNewsApiResponse["providerStatus"] = {
        gnews: createProviderStatus("GNews", trackedProviders.gnews.isConfigured(), {
          lastAttemptedAt: trackedProviders.gnews.isConfigured() ? attemptTimestamp : null,
        }),
        newsapi: createProviderStatus("NewsAPI", trackedProviders.newsapi.isConfigured(), {
          lastAttemptedAt: trackedProviders.newsapi.isConfigured() ? attemptTimestamp : null,
        }),
      };

      if (!configuredTrackedEntries.length && !configuredSupplementals.length) {
        const fallback = previous ?? buildSeedResponse();
        const response: HomepageNewsApiResponse = {
          ...fallback,
          source: fallback.source === "live" ? "cached" : fallback.source,
          providerStatus,
          status: {
            ...fallback.status,
            providerErrors: [],
            activeNewsMode: "live",
            refreshIntervalMinutes: getNewsRefreshIntervalMinutes(),
            cacheTtlMinutes: getNewsRefreshIntervalMinutes(),
            nextScheduledRefresh: new Date(Date.now() + getNewsRefreshIntervalMs()).toISOString(),
          },
        };

        await persistHomepageNews(response);
        return response;
      }

      const trackedResults = await Promise.allSettled(
        configuredTrackedEntries.map(async ([key, provider]) => ({
          key,
          result: await provider.fetchLatest(),
        })),
      );

      const supplementalResults = await Promise.allSettled(
        configuredSupplementals.map(async (provider) => ({
          name: provider.name,
          result: await provider.fetchLatest(),
        })),
      );

      const trackedStories: EditorialStory[] = [];

      trackedResults.forEach((result, index) => {
        const [key] = configuredTrackedEntries[index];
        const providerName = key === "gnews" ? "GNews" : "NewsAPI";
        if (result.status === "fulfilled") {
          const articles = result.value.result.articles;
          trackedStories.push(...articles);
          providerStatus[key] = createProviderStatus(providerName, true, {
            status: "success",
            lastAttemptedAt: attemptTimestamp,
            lastSuccessAt: attemptTimestamp,
            articleCount: articles.length,
          });
          return;
        }

        providerStatus[key] = createProviderStatus(providerName, true, {
          status: "error",
          lastAttemptedAt: attemptTimestamp,
          lastError: result.reason instanceof Error ? result.reason.message : "Unknown provider error",
        });
      });

      const supplementalStories = supplementalResults.flatMap((result) =>
        result.status === "fulfilled" ? result.value.result.articles : [],
      );
      const allStories = uniqueStories([...trackedStories, ...supplementalStories]);
      const providerErrors = normalizeProviderErrors(providerStatus);

      let response: HomepageNewsApiResponse;

      if (allStories.length) {
        const now = new Date().toISOString();
        response = {
          bundle: buildLiveHomepageBundle(allStories),
          lastUpdated: now,
          source: "live",
          providerStatus,
          status: {
            lastUpdated: now,
            lastSuccessfulLiveRefresh: now,
            nextScheduledRefresh: new Date(Date.now() + getNewsRefreshIntervalMs()).toISOString(),
            providerErrors,
            activeNewsMode: "live",
            refreshIntervalMinutes: getNewsRefreshIntervalMinutes(),
            cacheTtlMinutes: getNewsRefreshIntervalMinutes(),
          },
        };
      } else if (previous) {
        response = {
          ...previous,
          source: "cached",
          providerStatus,
          status: {
            ...previous.status,
            providerErrors,
            activeNewsMode: "live",
            refreshIntervalMinutes: getNewsRefreshIntervalMinutes(),
            cacheTtlMinutes: getNewsRefreshIntervalMinutes(),
            nextScheduledRefresh: new Date(Date.now() + getNewsRefreshIntervalMs()).toISOString(),
          },
        };
      } else {
        const seed = buildSeedResponse();
        response = {
          ...seed,
          providerStatus,
          status: {
            ...seed.status,
            providerErrors,
            activeNewsMode: "live",
            refreshIntervalMinutes: getNewsRefreshIntervalMinutes(),
            cacheTtlMinutes: getNewsRefreshIntervalMinutes(),
            nextScheduledRefresh: new Date(Date.now() + getNewsRefreshIntervalMs()).toISOString(),
          },
        };
      }

      console.info("[news-refresh]", {
        reason,
        mode,
        source: response.source,
        lastUpdated: response.lastUpdated,
        lastSuccessfulLiveRefresh: response.status.lastSuccessfulLiveRefresh,
        nextScheduledRefresh: response.status.nextScheduledRefresh,
        providerErrors,
        refreshIntervalMinutes: response.status.refreshIntervalMinutes,
      });

      await persistHomepageNews(response);
      return response;
    } catch (error) {
      console.error("[news-refresh] failed to refresh homepage news", error);
      return schedulerGlobal.__homepageNewsLastResponse ?? buildSeedResponse();
    }
  })();

  try {
    return await schedulerGlobal.__homepageNewsRefreshPromise;
  } finally {
    schedulerGlobal.__homepageNewsRefreshPromise = null;
  }
}

export function ensureHomepageNewsRefreshScheduler() {
  if (getNewsMode() !== "live" || schedulerGlobal.__homepageNewsRefreshInterval) {
    return;
  }

  void refreshHomepageNews("startup");

  const interval = setInterval(() => {
    void refreshHomepageNews("scheduled");
  }, getNewsRefreshIntervalMs());

  if (typeof interval.unref === "function") {
    interval.unref();
  }

  schedulerGlobal.__homepageNewsRefreshInterval = interval;
}

export async function getHomepageNewsResponse(): Promise<HomepageNewsApiResponse> {
  try {
    const heroOverrides = await getHomepageHeroOverrides();
    const mode = getNewsMode();
    if (mode === "seed") {
      const seedResponse = buildSeedResponse();
      schedulerGlobal.__homepageNewsLastResponse = seedResponse;
      return {
        ...seedResponse,
        bundle: applyHomepageHeroSelection(
          filterHomepageBundleToVisibleStories(seedResponse.bundle, heroOverrides.visibleCmsStoryIds),
          heroOverrides.manualHero,
          heroOverrides.fallbackHero,
          heroOverrides.heroCarouselStories,
        ),
      };
    }

    ensureHomepageNewsRefreshScheduler();

    const persisted = (await readPersistedHomepageNews()) ?? schedulerGlobal.__homepageNewsLastResponse ?? null;
    if (!persisted) {
      const fresh = await refreshHomepageNews("initial-request");
      return {
        ...fresh,
        bundle: applyHomepageHeroSelection(
          filterHomepageBundleToVisibleStories(fresh.bundle, heroOverrides.visibleCmsStoryIds),
          heroOverrides.manualHero,
          heroOverrides.fallbackHero,
          heroOverrides.heroCarouselStories,
        ),
      };
    }

    if (isRefreshDue(persisted)) {
      void refreshHomepageNews("request-due");
    }

    return {
      ...persisted,
      bundle: applyHomepageHeroSelection(
        filterHomepageBundleToVisibleStories(persisted.bundle, heroOverrides.visibleCmsStoryIds),
        heroOverrides.manualHero,
        heroOverrides.fallbackHero,
        heroOverrides.heroCarouselStories,
      ),
    };
  } catch (error) {
    console.error("[news-refresh] failed to load homepage response", error);
    return schedulerGlobal.__homepageNewsLastResponse ?? buildSeedResponse();
  }
}

export async function getHomepageNewsBundle(): Promise<HomepageNewsBundle> {
  const response = await getHomepageNewsResponse();
  return response.bundle;
}

export async function getHomepageStoryBySlug(slug: string): Promise<EditorialStory | null> {
  const response = await getHomepageNewsResponse();
  const normalizedSlug = normalizeSlug(slug);
  const liveOrSeedStory = flattenBundleStories(response.bundle).find((story) => story.slug === slug || story.slug === normalizedSlug);

  if (liveOrSeedStory) {
    return liveOrSeedStory;
  }

  return getSeedStoryBySlug(normalizedSlug);
}

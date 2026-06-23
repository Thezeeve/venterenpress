export type NewsMode = "seed" | "live";

export type EditorialAuthor = {
  name: string;
  role: string;
};

export type EditorialStorySourceType = "manual" | "live" | "seed";

export type EditorialStory = {
  id: string;
  title: string;
  slug: string;
  category: string;
  desk?: string;
  edition: string;
  region: string;
  summary: string;
  content: string[];
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  author: EditorialAuthor;
  publishedAt: string;
  readingTimeMinutes: number;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  sourceName: string;
  sourceUrl: string | null;
  provider: string;
  storySourceType: EditorialStorySourceType;
  isBreaking?: boolean;
  isOpinion?: boolean;
  isLive?: boolean;
  isMostRead?: boolean;
  href?: string;
  isExternal?: boolean;
};

export type LatestSidebarItem = {
  id: string;
  headline: string;
  category: string;
  publishedAt: string;
  href: string;
  isExternal?: boolean;
};

export type BreakingBanner = {
  id: string;
  title: string;
  summary: string;
  linkUrl: string;
};

export type HomepageNewsBundle = {
  mode: NewsMode;
  breakingBanners: BreakingBanner[];
  heroStory: EditorialStory;
  heroCarouselStories: EditorialStory[];
  latestSidebar: LatestSidebarItem[];
  topStories: EditorialStory[];
  worldNews: EditorialStory[];
  businessNews: EditorialStory[];
  technologyNews: EditorialStory[];
  sportsNews: EditorialStory[];
  liveCoverage: EditorialStory[];
  opinion: EditorialStory[];
  mostRead: EditorialStory[];
};

export type HomepageNewsSource = "seed" | "live" | "cached";

export type ProviderRuntimeStatus = {
  name: string;
  configured: boolean;
  status: "idle" | "success" | "error" | "skipped";
  lastAttemptedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  articleCount: number;
};

export type HomepageNewsRefreshStatus = {
  lastUpdated: string;
  lastSuccessfulLiveRefresh: string | null;
  nextScheduledRefresh: string | null;
  providerErrors: string[];
  activeNewsMode: NewsMode;
  refreshIntervalMinutes: number;
  cacheTtlMinutes: number;
};

export type HomepageNewsApiResponse = {
  bundle: HomepageNewsBundle;
  lastUpdated: string;
  source: HomepageNewsSource;
  providerStatus: {
    gnews: ProviderRuntimeStatus;
    newsapi: ProviderRuntimeStatus;
  };
  status: HomepageNewsRefreshStatus;
};

export type ProviderFetchResult = {
  articles: EditorialStory[];
};

export interface NewsProvider {
  name: string;
  isConfigured(): boolean;
  fetchLatest(): Promise<ProviderFetchResult>;
}

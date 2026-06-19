import { cleanNewsText } from "@/lib/news-providers/clean-news-text";

export type NewsCategoryKey = "world" | "business" | "technology" | "sports" | "opinion" | "spacex";

type CuratedImageDescriptor = {
  path: string;
  tags: readonly string[];
  quality: number;
};

export type NewsImageSelection = {
  imageUrl: string | null;
  confidence: number;
  isStrongMatch: boolean;
  categoryKey: NewsCategoryKey;
};

const WORLD_KEYWORDS = [
  "war",
  "conflict",
  "attack",
  "military",
  "airport",
  "russia",
  "ukraine",
  "iran",
  "israel",
  "nato",
  "un",
  "united nations",
  "government",
  "election",
  "president",
  "summit",
  "diplomacy",
  "ceasefire",
  "humanitarian",
  "minister",
  "parliament",
  "border",
  "maritime",
] as const;

const TECHNOLOGY_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "robot",
  "robotics",
  "chip",
  "nvidia",
  "openai",
  "machine learning",
  "datacenter",
  "data center",
  "cloud",
  "software",
  "apple",
  "google",
  "meta",
  "microsoft",
  "server",
  "cyber",
  "semiconductor",
] as const;

const SPORTS_KEYWORDS = [
  "fifa",
  "world cup",
  "football",
  "soccer",
  "tennis",
  "nba",
  "athlete",
  "tournament",
  "match",
  "stadium",
  "player",
  "brazil",
  "spain",
  "morocco",
] as const;

const BUSINESS_KEYWORDS = [
  "interest rates",
  "inflation",
  "economy",
  "market",
  "markets",
  "stocks",
  "banking",
  "bank",
  "energy",
  "trade",
  "traders",
  "wall street",
  "exchange",
  "oil",
  "finance",
  "financial",
  "rates",
  "central bank",
] as const;

const OPINION_KEYWORDS = ["opinion", "commentary", "editorial", "analysis", "column", "notebook"] as const;
const SPACEX_KEYWORDS = ["spacex", "rocket", "starship", "satellite", "ipo", "space", "launch", "orbital"] as const;

const CURATED_IMAGES: Record<Exclude<NewsCategoryKey, "spacex">, readonly CuratedImageDescriptor[]> = {
  world: [
    { path: "/news/world/world3.jpg", tags: ["government", "president", "election", "parliament", "capitol"], quality: 10 },
    { path: "/news/world/world5.jpg", tags: ["summit", "nato", "diplomacy", "meeting", "security", "conflict"], quality: 9 },
    { path: "/news/world/world6.jpg", tags: ["summit", "nato", "flags", "diplomacy", "government"], quality: 9 },
    { path: "/news/world/world2.jpg", tags: ["city", "skyline", "airport", "international", "capital"], quality: 8 },
    { path: "/news/world/world1.jpg", tags: ["city", "bridge", "capital", "international", "europe"], quality: 7 },
  ],
  business: [
    { path: "/news/business/business4.jpg", tags: ["stocks", "exchange", "traders", "banking", "finance"], quality: 10 },
    { path: "/news/business/business3.jpg", tags: ["market", "stocks", "bull", "traders", "economy"], quality: 9 },
    { path: "/news/business/business5.jpg", tags: ["trade", "financial", "wall street", "banking", "markets"], quality: 9 },
    { path: "/news/business/business2.jpg", tags: ["office", "financial district", "economy", "trade", "business"], quality: 8 },
    { path: "/news/business/business1.jpg", tags: ["office", "banking", "business", "financial district"], quality: 7 },
  ],
  technology: [
    { path: "/news/technology/business7.jpg", tags: ["spacex", "rocket", "starship", "satellite", "launch", "ipo"], quality: 10 },
    { path: "/news/technology/datacenter1.jpg", tags: ["datacenter", "data center", "cloud", "server", "infrastructure"], quality: 10 },
    { path: "/news/technology/tech2.jpg", tags: ["datacenter", "cloud", "server", "infrastructure", "nvidia"], quality: 9 },
    { path: "/news/technology/tech3.jpg", tags: ["ai", "openai", "machine learning", "lab", "software", "apple", "google", "meta", "microsoft"], quality: 9 },
    { path: "/news/technology/tech4.jpg", tags: ["robot", "robotics", "ai", "artificial intelligence"], quality: 8 },
    { path: "/news/technology/tech6.jpg", tags: ["robotics", "lab", "hardware", "engineering", "technology"], quality: 8 },
    { path: "/news/technology/tech5.jpg", tags: ["robotics", "hardware", "engineering", "technology"], quality: 7 },
  ],
  sports: [
    { path: "/news/sports/spain-football.jpg", tags: ["spain", "football", "soccer", "player", "match"], quality: 10 },
    { path: "/news/sports/brazil-morocco.png", tags: ["brazil", "morocco", "player", "match", "world cup"], quality: 10 },
    { path: "/news/sports/brazil-morocco.jpg", tags: ["brazil", "morocco", "player", "match", "stadium"], quality: 9 },
    { path: "/news/sports/spain-draw.png", tags: ["spain", "player", "match", "world cup"], quality: 10 },
    { path: "/news/sports/world-cup-2026.jpg", tags: ["world cup", "tournament", "fifa", "competition"], quality: 9 },
    { path: "/news/sports/football1.jpg", tags: ["football", "soccer", "athlete", "competition"], quality: 8 },
    { path: "/news/sports/football3.jpg", tags: ["stadium", "tournament", "competition", "athlete"], quality: 9 },
    { path: "/news/sports/football4.jpg", tags: ["stadium", "tournament", "competition", "match"], quality: 9 },
    { path: "/news/sports/fifa-world-cup-2026.png", tags: ["fifa", "world cup", "tournament"], quality: 8 },
    { path: "/news/sports/football2.jpg", tags: ["player", "athlete", "football", "soccer"], quality: 8 },
    { path: "/news/sports/football5.jpg", tags: ["stadium", "football", "soccer", "match"], quality: 8 },
  ],
  opinion: [
    { path: "/news/opinion/opinion1.jpg", tags: ["editorial", "analysis", "writing desk", "notebook", "commentary"], quality: 10 },
    { path: "/news/opinion/opinion2.jpg", tags: ["editorial", "analysis", "writing desk", "notebook"], quality: 9 },
    { path: "/news/opinion/opinion4.jpg", tags: ["newsroom", "editorial", "broadcast", "journalists"], quality: 8 },
    { path: "/news/opinion/opinion3.jpg", tags: ["newsroom", "editorial", "analysis"], quality: 7 },
    { path: "/news/opinion/opinion5.jpg", tags: ["commentary", "analysis", "column", "editorial board"], quality: 8 },
  ],
};

export const NEWS_FALLBACK_IMAGES = {
  world: CURATED_IMAGES.world[0].path,
  business: CURATED_IMAGES.business[0].path,
  technology: CURATED_IMAGES.technology[0].path,
  sports: CURATED_IMAGES.sports[2].path,
  opinion: CURATED_IMAGES.opinion[0].path,
  spacex: "/news/technology/business7.jpg",
} as const;

function normalizeValue(value?: string | null) {
  return cleanNewsText(value ?? "").toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsKeyword(haystack: string, keyword: string) {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}([^a-z0-9]|$)`);
  return pattern.test(haystack);
}

function includesAny(haystack: string, hints: readonly string[]) {
  return hints.some((hint) => containsKeyword(haystack, hint));
}

function hashStorySeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function normalizeNewsCategoryKey(category?: string | null, title?: string | null) {
  const categoryValue = normalizeValue(category);
  const titleValue = normalizeValue(title);
  const combined = `${categoryValue} ${titleValue}`;

  if (includesAny(combined, SPACEX_KEYWORDS)) {
    return "spacex";
  }
  if (includesAny(combined, OPINION_KEYWORDS)) {
    return "opinion";
  }
  if (includesAny(combined, TECHNOLOGY_KEYWORDS) || /(technology|tech|cyber|semiconductor)/.test(combined)) {
    return "technology";
  }
  if (includesAny(combined, BUSINESS_KEYWORDS) || /(business|finance|economy|bank|markets)/.test(combined)) {
    return "business";
  }
  if (includesAny(combined, SPORTS_KEYWORDS) || /(sports|football|soccer|match|tournament)/.test(combined)) {
    return "sports";
  }
  return "world";
}

function scoreImageDescriptor(image: CuratedImageDescriptor, combined: string, usedImages: readonly string[], preferPremium: boolean) {
  let score = image.quality * (preferPremium ? 2 : 1);

  for (const tag of image.tags) {
    if (containsKeyword(combined, tag)) {
      score += 12;
    }
  }

  if (includesAny(combined, WORLD_KEYWORDS) && image.path.startsWith("/news/world/")) {
    score += 4;
  }
  if (includesAny(combined, BUSINESS_KEYWORDS) && image.path.startsWith("/news/business/")) {
    score += 4;
  }
  if (includesAny(combined, TECHNOLOGY_KEYWORDS) && image.path.startsWith("/news/technology/")) {
    score += 4;
  }
  if (includesAny(combined, SPORTS_KEYWORDS) && image.path.startsWith("/news/sports/")) {
    score += 4;
  }
  if (includesAny(combined, OPINION_KEYWORDS) && image.path.startsWith("/news/opinion/")) {
    score += 4;
  }

  if (includesAny(combined, ["war", "conflict", "attack", "military", "ceasefire", "diplomacy", "summit"])) {
    if (image.path === "/news/world/world5.jpg" || image.path === "/news/world/world6.jpg") {
      score += 14;
    }
  }
  if (includesAny(combined, ["government", "election", "president", "parliament", "congress"])) {
    if (image.path === "/news/world/world3.jpg") {
      score += 14;
    }
  }
  if (includesAny(combined, ["airport", "city", "capital", "international"])) {
    if (image.path === "/news/world/world2.jpg" || image.path === "/news/world/world1.jpg") {
      score += 12;
    }
  }
  if (includesAny(combined, ["stocks", "market", "markets", "traders", "exchange", "banking", "interest rates", "inflation"])) {
    if (image.path === "/news/business/business4.jpg" || image.path === "/news/business/business3.jpg" || image.path === "/news/business/business5.jpg") {
      score += 14;
    }
  }
  if (includesAny(combined, ["office", "trade", "economy", "business"])) {
    if (image.path === "/news/business/business2.jpg" || image.path === "/news/business/business1.jpg") {
      score += 8;
    }
  }
  if (includesAny(combined, ["ai", "artificial intelligence", "openai", "machine learning", "software", "apple", "google", "meta", "microsoft"])) {
    if (image.path === "/news/technology/tech3.jpg") {
      score += 16;
    }
  }
  if (includesAny(combined, ["datacenter", "data center", "cloud", "server", "nvidia", "infrastructure"])) {
    if (image.path === "/news/technology/datacenter1.jpg" || image.path === "/news/technology/tech2.jpg") {
      score += 16;
    }
  }
  if (includesAny(combined, ["robot", "robotics", "hardware", "engineering"])) {
    if (image.path === "/news/technology/tech4.jpg" || image.path === "/news/technology/tech6.jpg" || image.path === "/news/technology/tech5.jpg") {
      score += 14;
    }
  }
  if (includesAny(combined, ["fifa", "world cup", "tournament", "competition"])) {
    if (image.path === "/news/sports/world-cup-2026.jpg" || image.path === "/news/sports/football3.jpg" || image.path === "/news/sports/football4.jpg") {
      score += 14;
    }
  }
  if (includesAny(combined, ["spain", "player", "athlete"])) {
    if (image.path === "/news/sports/spain-draw.png" || image.path === "/news/sports/football2.jpg") {
      score += 14;
    }
  }
  if (includesAny(combined, ["brazil", "morocco"])) {
    if (image.path === "/news/sports/brazil-morocco.png") {
      score += 16;
    }
  }
  if (includesAny(combined, ["opinion", "commentary", "editorial", "analysis", "writing"])) {
    if (image.path === "/news/opinion/opinion1.jpg" || image.path === "/news/opinion/opinion2.jpg") {
      score += 14;
    }
  }

  score -= usedImages.filter((usedImage) => usedImage === image.path).length * 10;
  return score;
}

export function resolveNewsImageSelection(options: {
  category?: string | null;
  title?: string | null;
  summary?: string | null;
  slug?: string | null;
  usedImages?: readonly string[];
  preferPremium?: boolean;
  minimumScore?: number;
}) {
  const categoryKey = normalizeNewsCategoryKey(options.category, options.title);
  const combined = normalizeValue(`${options.slug ?? ""} ${options.title ?? ""} ${options.summary ?? ""} ${options.category ?? ""}`);

  if (categoryKey === "spacex") {
    return {
      imageUrl: NEWS_FALLBACK_IMAGES.spacex,
      confidence: 1,
      isStrongMatch: true,
      categoryKey,
    } satisfies NewsImageSelection;
  }

  const imagePool = CURATED_IMAGES[categoryKey];
  const ranked = imagePool
    .map((image) => ({
      image,
      score: scoreImageDescriptor(image, combined, options.usedImages ?? [], options.preferPremium ?? false),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return hashStorySeed(`${combined}:${left.image.path}`) - hashStorySeed(`${combined}:${right.image.path}`);
    });

  const bestMatch = ranked[0];
  const minimumScore = options.minimumScore ?? (options.preferPremium ? 28 : 24);
  const isStrongMatch = Boolean(bestMatch && bestMatch.score >= minimumScore);

  return {
    imageUrl: isStrongMatch ? bestMatch.image.path : null,
    confidence: bestMatch ? Math.max(0, Math.min(1, bestMatch.score / 40)) : 0,
    isStrongMatch,
    categoryKey,
  } satisfies NewsImageSelection;
}

export function getFallbackImageForCategory(
  category?: string | null,
  title?: string | null,
  seed?: string | null,
  options?: { usedImages?: readonly string[]; preferPremium?: boolean },
) {
  const selection = resolveNewsImageSelection({
    category,
    title,
    slug: seed,
    summary: seed,
    usedImages: options?.usedImages,
    preferPremium: options?.preferPremium,
    minimumScore: 0,
  });

  return selection.imageUrl ?? NEWS_FALLBACK_IMAGES[selection.categoryKey as keyof typeof NEWS_FALLBACK_IMAGES];
}

export function sanitizeNewsImage(options: {
  category?: string | null;
  title?: string | null;
  summary?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  usedImages?: readonly string[];
  preferPremium?: boolean;
  minimumScore?: number;
}) {
  return resolveNewsImageSelection({
    category: options.category,
    title: options.title,
    summary: options.summary,
    slug: options.slug,
    usedImages: options.usedImages,
    preferPremium: options.preferPremium,
    minimumScore: options.minimumScore,
  }).imageUrl;
}

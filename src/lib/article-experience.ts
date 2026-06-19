import type { EditorialStory } from "@/lib/news-providers/types";

export type StoryRecommendationInput = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  publishedAt: string;
  tags?: string[];
  href?: string;
  isExternal?: boolean;
  isBreaking?: boolean;
  isMostRead?: boolean;
  featuredImageAlt?: string | null;
  featuredImageUrl?: string | null;
  sourceName?: string | null;
};

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);
}

function toKeywordSet(story: Pick<StoryRecommendationInput, "title" | "summary" | "tags" | "category">) {
  return new Set([
    ...tokenize(story.title),
    ...tokenize(story.summary),
    ...tokenize(story.category),
    ...(story.tags ?? []).flatMap((tag) => tokenize(tag)),
  ]);
}

function countKeywordOverlap(
  left: Pick<StoryRecommendationInput, "title" | "summary" | "tags" | "category">,
  right: Pick<StoryRecommendationInput, "title" | "summary" | "tags" | "category">,
) {
  const leftKeywords = toKeywordSet(left);
  const rightKeywords = toKeywordSet(right);
  let overlap = 0;

  leftKeywords.forEach((keyword) => {
    if (rightKeywords.has(keyword)) {
      overlap += 1;
    }
  });

  return overlap;
}

function categoryMatch(left: string, right: string) {
  const leftValue = left.toLowerCase();
  const rightValue = right.toLowerCase();
  return leftValue === rightValue || leftValue.includes(rightValue) || rightValue.includes(leftValue);
}

function scoreRecency(publishedAt: string) {
  const ageHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60));
  return Math.max(0, 18 - ageHours / 6);
}

function uniqueStories<T extends StoryRecommendationInput>(stories: T[]) {
  const seen = new Set<string>();
  return stories.filter((story) => {
    const key = story.href ?? story.slug;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function getNewsroomDeskLabel(category: string, articleType?: string | null) {
  const normalized = `${category} ${articleType ?? ""}`.toLowerCase();

  if (normalized.includes("opinion") || normalized.includes("editorial")) {
    return "VANTERENPRESS Opinion Desk";
  }
  if (normalized.includes("technology") || normalized.includes("tech") || normalized.includes("cyber")) {
    return "VANTERENPRESS Technology Desk";
  }
  if (normalized.includes("business") || normalized.includes("finance") || normalized.includes("markets") || normalized.includes("economy")) {
    return "VANTERENPRESS Business Desk";
  }
  if (normalized.includes("sport") || normalized.includes("football") || normalized.includes("world cup")) {
    return "VANTERENPRESS Sports Desk";
  }
  if (normalized.includes("entertainment") || normalized.includes("culture")) {
    return "VANTERENPRESS Culture Desk";
  }

  return "VANTERENPRESS International Desk";
}

export function selectRelatedStories<T extends StoryRecommendationInput>(
  current: Pick<StoryRecommendationInput, "id" | "slug" | "title" | "category" | "summary" | "tags">,
  candidates: T[],
  count = 3,
) {
  return uniqueStories(candidates)
    .filter((candidate) => candidate.slug !== current.slug && candidate.id !== current.id)
    .map((candidate) => {
      let score = scoreRecency(candidate.publishedAt);
      score += countKeywordOverlap(current, candidate) * 7;

      if (categoryMatch(current.category, candidate.category)) {
        score += 22;
      }

      if ((current.tags ?? []).length && (candidate.tags ?? []).length) {
        const currentTags = new Set((current.tags ?? []).map((tag) => tag.toLowerCase()));
        score += (candidate.tags ?? []).filter((tag) => currentTags.has(tag.toLowerCase())).length * 10;
      }

      if ((candidate.isBreaking ?? false)) {
        score += 2;
      }

      return { candidate, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, count)
    .map((entry) => entry.candidate);
}

export function selectTrendingStories<T extends StoryRecommendationInput>(stories: T[], count = 5) {
  return uniqueStories(stories)
    .map((story) => {
      let score = scoreRecency(story.publishedAt);
      score += (story.isMostRead ?? false) ? 18 : 0;
      score += (story.isBreaking ?? false) ? 10 : 0;
      score += countKeywordOverlap(story, story) > 0 ? 0 : 0;

      return { story, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, count)
    .map((entry) => entry.story);
}

export function toRecommendationStory(story: EditorialStory): StoryRecommendationInput {
  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    category: story.category,
    summary: story.summary,
    publishedAt: story.publishedAt,
    tags: story.tags,
    href: story.href,
    isExternal: story.isExternal,
    isBreaking: story.isBreaking,
    isMostRead: story.isMostRead,
    featuredImageAlt: story.featuredImageAlt,
    featuredImageUrl: story.featuredImageUrl,
    sourceName: story.sourceName,
  };
}

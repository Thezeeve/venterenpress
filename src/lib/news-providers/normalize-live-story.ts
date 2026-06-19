import { cleanNewsContent, cleanNewsText } from "@/lib/news-providers/clean-news-text";
import {
  getFallbackImageForCategory as getSanitizedFallbackImageForCategory,
  sanitizeNewsImage,
} from "@/lib/news-providers/sanitize-news-image";
import type { EditorialStory } from "@/lib/news-providers/types";

export function normalizeLiveStory(story: EditorialStory) {
  if (!story.isExternal) {
    return story;
  }

  const cleanedTitle = cleanNewsText(story.title);
  const cleanedSummary = cleanNewsText(story.summary);
  const cleanedContent = cleanNewsContent(story.content);
  const cleanedCategory = cleanNewsText(story.category) || "World";
  const cleanedDesk = cleanNewsText(story.desk);
  const cleanedAuthorName = cleanNewsText(story.author.name) || "Syndicated source";
  const cleanedAuthorRole = cleanNewsText(story.author.role) || "Syndicated source";
  const cleanedSourceName = cleanNewsText(story.sourceName) || cleanedAuthorName;
  const cleanedTags = story.tags.map((tag) => cleanNewsText(tag)).filter(Boolean);

  const normalized: EditorialStory = {
    ...story,
    title: cleanedTitle,
    category: cleanedCategory,
    desk: cleanedDesk || undefined,
    summary: cleanedSummary || cleanedTitle,
    content: cleanedContent.length ? cleanedContent : [cleanedSummary || cleanedTitle],
    featuredImageAlt: cleanNewsText(story.featuredImageAlt) || cleanedTitle,
    author: {
      name: cleanedAuthorName,
      role: cleanedAuthorRole,
    },
    tags: cleanedTags.length ? cleanedTags : [cleanedCategory],
    seoTitle: cleanNewsText(story.seoTitle) || cleanedTitle,
    seoDescription: cleanNewsText(story.seoDescription) || cleanedSummary || cleanedTitle,
    sourceName: cleanedSourceName,
    href: `/articles/${story.slug}`,
  };

  normalized.featuredImageUrl = sanitizeNewsImage({
    slug: normalized.slug,
    category: normalized.category,
    title: normalized.title,
    summary: normalized.summary,
    imageUrl: normalized.featuredImageUrl,
  });

  return normalized;
}

export function getFallbackImageForCategory(category: string) {
  return getSanitizedFallbackImageForCategory(category);
}

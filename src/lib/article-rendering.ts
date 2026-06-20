import { resolveNewsImageSelection } from "@/lib/news-providers/sanitize-news-image";

export function resolveArticleHeroImage(input: {
  slug: string;
  category: string;
  title: string;
  summary: string;
  featuredImageUrl?: string | null;
  imageUrl?: string | null;
}) {
  if (input.featuredImageUrl) {
    return input.featuredImageUrl;
  }

  if (input.imageUrl) {
    return input.imageUrl;
  }

  return resolveNewsImageSelection({
    slug: input.slug,
    category: input.category,
    title: input.title,
    summary: input.summary,
    preferPremium: true,
    minimumScore: 28,
  }).imageUrl;
}

export function selectArticlePageSource<TArticle, TExternal>(input: {
  article: TArticle | null;
  externalStory: TExternal | null;
}) {
  if (input.article) {
    return {
      kind: "article" as const,
      article: input.article,
      externalStory: null,
    };
  }

  if (input.externalStory) {
    return {
      kind: "external" as const,
      article: null,
      externalStory: input.externalStory,
    };
  }

  return {
    kind: "missing" as const,
    article: null,
    externalStory: null,
  };
}

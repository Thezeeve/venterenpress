import { resolveNewsImageSelection } from "@/lib/news-providers/sanitize-news-image";

export type ResolvedArticleImage = {
  imageUrl: string | null;
  imageAlt: string | null;
  source: "direct" | "fallback" | "none";
};

type ImageMediaValue =
  | string
  | null
  | undefined
  | {
      url?: string | null;
      src?: string | null;
      path?: string | null;
      imageUrl?: string | null;
      featuredImageUrl?: string | null;
      thumbnailUrl?: string | null;
      thumbnail?: string | { url?: string | null; src?: string | null } | null;
      alt?: string | null;
      altText?: string | null;
      imageAlt?: string | null;
    };

type ResolveArticleImageInput = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  featuredImage?: ImageMediaValue;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  image?: ImageMediaValue;
  imageUrl?: string | null;
  imageAlt?: string | null;
  coverImage?: ImageMediaValue;
  thumbnail?: ImageMediaValue;
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
  media?: ImageMediaValue | ImageMediaValue[] | null;
};

function normalizeImageCandidate(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  if (
    normalized.startsWith("/")
    || normalized.startsWith("http://")
    || normalized.startsWith("https://")
    || normalized.startsWith("blob:")
    || normalized.startsWith("data:")
  ) {
    return normalized;
  }

  return null;
}

function extractImageValue(value: ImageMediaValue | ImageMediaValue[] | null | undefined): { url: string | null; alt: string | null } {
  if (!value) {
    return { url: null, alt: null };
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const extracted = extractImageValue(item);
      if (extracted.url) {
        return extracted;
      }
    }

    return { url: null, alt: null };
  }

  if (typeof value === "string") {
    return { url: normalizeImageCandidate(value), alt: null };
  }

  const nestedThumbnail = extractImageValue(value.thumbnail);
  const url = [
    value.url,
    value.src,
    value.path,
    value.imageUrl,
    value.featuredImageUrl,
    value.thumbnailUrl,
    nestedThumbnail.url,
  ].map(normalizeImageCandidate).find(Boolean) ?? null;

  return {
    url,
    alt: value.altText?.trim() || value.alt?.trim() || value.imageAlt?.trim() || nestedThumbnail.alt,
  };
}

function findDirectArticleImage(input: ResolveArticleImageInput) {
  const candidates = [
    extractImageValue(input.featuredImage),
    { url: normalizeImageCandidate(input.featuredImageUrl), alt: input.featuredImageAlt?.trim() || null },
    extractImageValue(input.image),
    { url: normalizeImageCandidate(input.imageUrl), alt: input.imageAlt?.trim() || null },
    extractImageValue(input.coverImage),
    extractImageValue(input.thumbnail),
    { url: normalizeImageCandidate(input.thumbnailUrl), alt: null },
    { url: normalizeImageCandidate(input.mediaUrl), alt: null },
    extractImageValue(input.media),
  ];

  for (const candidate of candidates) {
    if (candidate.url) {
      return candidate;
    }
  }

  return { url: null, alt: null };
}

export function resolveArticleImage(input: ResolveArticleImageInput, options?: {
  usedImages?: readonly string[];
  preferPremium?: boolean;
  minimumScore?: number;
}): ResolvedArticleImage {
  const directImage = findDirectArticleImage(input);
  if (directImage.url) {
    return {
      imageUrl: directImage.url,
      imageAlt: directImage.alt ?? input.featuredImageAlt?.trim() ?? input.imageAlt?.trim() ?? input.title,
      source: "direct",
    };
  }

  const fallbackImage = resolveNewsImageSelection({
    slug: input.slug,
    category: input.category,
    title: input.title,
    summary: input.summary,
    usedImages: options?.usedImages,
    preferPremium: options?.preferPremium ?? true,
    minimumScore: options?.minimumScore ?? 28,
  }).imageUrl;

  if (fallbackImage) {
    return {
      imageUrl: fallbackImage,
      imageAlt: input.featuredImageAlt?.trim() ?? input.imageAlt?.trim() ?? input.title,
      source: "fallback",
    };
  }

  return {
    imageUrl: null,
    imageAlt: input.featuredImageAlt?.trim() ?? input.imageAlt?.trim() ?? input.title,
    source: "none",
  };
}

export function resolveArticleHeroImage(input: ResolveArticleImageInput) {
  return resolveArticleImage(input, {
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

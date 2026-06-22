import type { Metadata } from "next";
import { PUBLIC_CATEGORY_CONFIG, PUBLIC_TOPIC_CONFIG } from "@/lib/public-story-feed";
import { siteConfig } from "@/lib/site";

type BreadcrumbItem = {
  name: string;
  url: string;
};

const organizationName = siteConfig.name;
const logoUrl = `${siteConfig.url}/vanterenpress-broadcast-logo.png`;

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.url).toString();
}

export function resolvePublicTaxonomyHref(slug: string) {
  const categoryEntry = Object.entries(PUBLIC_CATEGORY_CONFIG).find(([key]) => key === slug);
  if (categoryEntry) {
    return categoryEntry[1].href;
  }

  const topicEntry = Object.entries(PUBLIC_TOPIC_CONFIG).find(([key]) => key === slug);
  if (topicEntry) {
    return topicEntry[1].href;
  }

  return `/categories/${slug}`;
}

export function getSectionSeoCopy(slug: string, fallbackTitle?: string, fallbackDescription?: string) {
  const config = {
    world: {
      title: "World News",
      description: "International coverage, geopolitics, diplomacy, and major global developments from VANTERENPRESS.",
    },
    politics: {
      title: "Politics News",
      description: "Government, elections, legislation, and power shifts shaping the public agenda.",
    },
    business: {
      title: "Business News",
      description: "Corporate strategy, economic shifts, and boardroom reporting from across the global economy.",
    },
    technology: {
      title: "Technology News",
      description: "AI, platforms, infrastructure, and the companies reshaping global technology markets.",
    },
    crypto: {
      title: "Crypto News",
      description: "Digital asset markets, regulation, blockchain infrastructure, and crypto industry developments.",
    },
    opinion: {
      title: "Opinion",
      description: "Sharp analysis, informed arguments, and perspective pieces from the VANTERENPRESS newsroom.",
    },
  } as const;

  if (slug in config) {
    return config[slug as keyof typeof config];
  }

  return {
    title: fallbackTitle ?? titleCase(slug),
    description: fallbackDescription ?? `Latest coverage and analysis for ${titleCase(slug)} from ${siteConfig.name}.`,
  };
}

export function buildBreadcrumbList(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: {
          "@id": `${siteConfig.url}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteConfig.url}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: organizationName,
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
        },
      },
      {
        "@type": "NewsMediaOrganization",
        "@id": `${siteConfig.url}/#newsmediaorganization`,
        name: organizationName,
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
        },
        publishingPrinciples: absoluteUrl("/editorial-standards"),
        ethicsPolicy: absoluteUrl("/ethics"),
        correctionsPolicy: absoluteUrl("/corrections"),
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            url: absoluteUrl("/contact"),
          },
          {
            "@type": "ContactPoint",
            contactType: "news tips",
            url: absoluteUrl("/contact"),
          },
        ],
        parentOrganization: {
          "@id": `${siteConfig.url}/#organization`,
        },
      },
    ],
  };
}

export function buildWebPageStructuredData(input: {
  title: string;
  description: string;
  url: string;
  breadcrumbs: BreadcrumbItem[];
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: input.title,
        description: input.description,
        url: input.url,
        isPartOf: {
          "@id": `${siteConfig.url}/#website`,
        },
        about: {
          "@id": `${siteConfig.url}/#newsmediaorganization`,
        },
      },
      buildBreadcrumbList(input.breadcrumbs),
    ],
  };
}

export function buildListingPageStructuredData(input: {
  title: string;
  description: string;
  url: string;
  breadcrumbs: BreadcrumbItem[];
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: input.title,
        description: input.description,
        url: input.url,
        isPartOf: {
          "@id": `${siteConfig.url}/#website`,
        },
      },
      buildBreadcrumbList(input.breadcrumbs),
    ],
  };
}

export function buildArticleStructuredData(input: {
  title: string;
  description: string;
  url: string;
  publishedTime?: string;
  modifiedTime?: string;
  section: string;
  image?: string | null;
  authorName: string;
  breadcrumbs: BreadcrumbItem[];
  isAccessibleForFree?: boolean;
}) {
  const image = input.image
    ? (input.image.startsWith("http") ? input.image : absoluteUrl(input.image))
    : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["NewsArticle", "Article"],
        headline: input.title,
        description: input.description,
        mainEntityOfPage: input.url,
        url: input.url,
        datePublished: input.publishedTime,
        dateModified: input.modifiedTime ?? input.publishedTime,
        articleSection: input.section,
        image: image ? [image] : undefined,
        isAccessibleForFree: input.isAccessibleForFree,
        author: {
          "@type": "Person",
          name: input.authorName,
        },
        publisher: {
          "@id": `${siteConfig.url}/#organization`,
        },
      },
      buildBreadcrumbList(input.breadcrumbs),
    ],
  };
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string | null;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  keywords?: string[];
}): Metadata {
  const canonical = absoluteUrl(input.path);
  const image = input.image ? (input.image.startsWith("http") ? input.image : absoluteUrl(input.image)) : absoluteUrl("/opengraph-image");

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: siteConfig.name,
      type: input.type ?? "website",
      images: [{ url: image }],
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime,
      section: input.section,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
    keywords: input.keywords,
  };
}

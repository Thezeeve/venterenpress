import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getCategoryStories } from "@/lib/public-story-feed";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata, resolvePublicTaxonomyHref } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function getCategory(slug: string) {
  if (!await isDatabaseAvailable()) {
    return { name: slug.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()), description: null };
  }

  try {
    return await prisma.category.findUnique({ where: { slug } });
  } catch {
    return { name: slug.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()), description: null };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {};
  }

  const title = `${category.name} News`;
  const description = category.description ?? `Fast-moving coverage, explainers, and analysis for ${category.name.toLowerCase()}.`;
  const canonicalPath = resolvePublicTaxonomyHref(slug);

  return buildPageMetadata({
    title,
    description,
    path: canonicalPath,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const stories = await getCategoryStories(slug);

  if (stories === null) {
    notFound();
  }

  return (
    <PublicStoryListingPage
      badge="Category"
      title={category.name}
      description={category.description ?? `Fast-moving coverage, explainers, and analysis for ${category.name.toLowerCase()}.`}
      stories={stories}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: category.name },
      ]}
      structuredData={buildListingPageStructuredData({
        title: `${category.name} News`,
        description: category.description ?? `Fast-moving coverage, explainers, and analysis for ${category.name.toLowerCase()}.`,
        url: absoluteUrl(resolvePublicTaxonomyHref(slug)),
        breadcrumbs: [
          { name: "Home", url: absoluteUrl("/") },
          { name: category.name, url: absoluteUrl(resolvePublicTaxonomyHref(slug)) },
        ],
      })}
    />
  );
}

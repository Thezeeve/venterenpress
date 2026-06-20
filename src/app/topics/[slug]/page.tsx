import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiscoveryPage } from "@/components/discovery/discovery-page";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getTopicStories } from "@/lib/public-story-feed";
import { newsroomArticleInclude } from "@/lib/newsroom";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata, resolvePublicTaxonomyHref } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stories = await getTopicStories(slug);
  const label = slug.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());

  if (stories !== null) {
    const description =
      slug === "politics"
        ? "Government, elections, legislation, and power shifts shaping the public agenda."
        : "Digital asset markets, regulation, blockchain infrastructure, and crypto industry developments.";

    return buildPageMetadata({
      title: `${label} News`,
      description,
      path: resolvePublicTaxonomyHref(slug),
    });
  }

  return {};
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stories = await getTopicStories(slug);
  if (stories !== null) {
    const label = slug.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());

    return (
      <PublicStoryListingPage
        badge="Topic"
        title={label}
        description={
          slug === "politics"
            ? "Government, elections, legislation, and power shifts shaping the public agenda."
            : "Digital asset markets, regulation, blockchain infrastructure, and crypto industry developments."
        }
        stories={stories}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label },
        ]}
        structuredData={buildListingPageStructuredData({
          title: `${label} News`,
          description:
            slug === "politics"
              ? "Government, elections, legislation, and power shifts shaping the public agenda."
              : "Digital asset markets, regulation, blockchain infrastructure, and crypto industry developments.",
          url: absoluteUrl(resolvePublicTaxonomyHref(slug)),
          breadcrumbs: [
            { name: "Home", url: absoluteUrl("/") },
            { name: label, url: absoluteUrl(resolvePublicTaxonomyHref(slug)) },
          ],
        })}
      />
    );
  }

  if (!await isDatabaseAvailable()) {
    notFound();
  }

  const [category, tag] = await Promise.all([
    prisma.category.findUnique({ where: { slug } }).catch(() => null),
    prisma.tag.findUnique({ where: { slug } }).catch(() => null),
  ]);

  if (!category && !tag) {
    notFound();
  }

  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      OR: [
        ...(category ? [{ categories: { some: { categoryId: category.id } } }] : []),
        ...(tag ? [{ tags: { some: { tagId: tag.id } } }] : []),
      ],
    },
    include: newsroomArticleInclude,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: 18,
  }).catch(() => []);

  const label = category?.name ?? tag?.name ?? slug;

  return (
    <DiscoveryPage
      badge="Topic"
      title={label}
      description={`Curated coverage around ${label}.`}
      articles={articles}
      sidebarTitle="Browse more"
      sidebarDescription="Move through the newsroom by section or edition."
      sidebarLinks={[
        { label: "Latest news", href: "/latest" },
        { label: "Most read", href: "/most-read" },
        { label: "Topics", href: "/topics" },
      ]}
    />
  );
}

import { notFound } from "next/navigation";
import { DiscoveryPage } from "@/components/discovery/discovery-page";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getTopicStories } from "@/lib/public-story-feed";
import { newsroomArticleInclude } from "@/lib/newsroom";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stories = await getTopicStories(slug);
  if (stories !== null) {
    return (
      <PublicStoryListingPage
        badge="Topic"
        title="Politics"
        description="Government, elections, legislation, and power shifts shaping the public agenda."
        stories={stories}
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

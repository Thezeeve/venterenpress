import { notFound } from "next/navigation";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getCategoryStories } from "@/lib/public-story-feed";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await (async () => {
    if (!await isDatabaseAvailable()) {
      return { name: slug.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()), description: null };
    }

    try {
      return await prisma.category.findUnique({ where: { slug } });
    } catch {
      return { name: slug.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()), description: null };
    }
  })();

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
    />
  );
}

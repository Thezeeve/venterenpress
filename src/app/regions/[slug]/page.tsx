import { notFound } from "next/navigation";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getRegionStories } from "@/lib/public-story-feed";

export const dynamic = "force-dynamic";

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stories = await getRegionStories(slug);

  if (!stories.length) {
    notFound();
  }

  return (
    <PublicStoryListingPage
      badge="Region"
      title={stories[0]?.region ?? slug.replace(/-/g, " ")}
      description={`Coverage and latest reporting for ${stories[0]?.region ?? slug.replace(/-/g, " ")}.`}
      stories={stories}
    />
  );
}

import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";

export const dynamic = "force-dynamic";

export default async function TechnologyPage() {
  const stories = await getSectionStories("technology");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Technology"
      description="AI, platforms, infrastructure, and the companies reshaping global technology markets."
      stories={stories}
    />
  );
}

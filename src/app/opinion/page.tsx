import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";

export const dynamic = "force-dynamic";

export default async function OpinionPage() {
  const stories = await getSectionStories("opinion");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Opinion"
      description="Sharp analysis, informed arguments, and perspective pieces from the VANTERENPRESS newsroom."
      stories={stories}
    />
  );
}

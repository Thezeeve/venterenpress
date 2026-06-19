import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";

export const dynamic = "force-dynamic";

export default async function SportsPage() {
  const stories = await getSectionStories("sports");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Sports"
      description="Major tournaments, club strategy, and the competition shaping the global sports calendar."
      stories={stories}
    />
  );
}

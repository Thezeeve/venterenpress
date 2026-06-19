import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";

export const dynamic = "force-dynamic";

export default async function WorldPage() {
  const stories = await getSectionStories("world");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="World"
      description="International coverage, geopolitics, diplomacy, and major global developments."
      stories={stories}
    />
  );
}

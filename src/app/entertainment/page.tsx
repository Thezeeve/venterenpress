import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";

export const dynamic = "force-dynamic";

export default async function EntertainmentPage() {
  const stories = await getSectionStories("entertainment");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Entertainment"
      description="Streaming, media strategy, and cultural industry coverage with a clean editorial focus."
      stories={stories}
    />
  );
}

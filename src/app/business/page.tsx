import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const stories = await getSectionStories("business");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Business"
      description="Corporate strategy, economic shifts, and boardroom reporting from across the global economy."
      stories={stories}
    />
  );
}

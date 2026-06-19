import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const stories = await getSectionStories("finance");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Finance"
      description="Markets, rates, capital flows, and the financial signals driving investor decisions."
      stories={stories}
    />
  );
}

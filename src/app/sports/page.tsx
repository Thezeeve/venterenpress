import type { Metadata } from "next";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Sports News",
  description: "Major tournaments, club strategy, and the competition shaping the global sports calendar.",
  path: "/sports",
});

export default async function SportsPage() {
  const stories = await getSectionStories("sports");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Sports"
      description="Major tournaments, club strategy, and the competition shaping the global sports calendar."
      stories={stories}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Sports" },
      ]}
      structuredData={buildListingPageStructuredData({
        title: "Sports News",
        description: "Major tournaments, club strategy, and the competition shaping the global sports calendar.",
        url: absoluteUrl("/sports"),
        breadcrumbs: [
          { name: "Home", url: absoluteUrl("/") },
          { name: "Sports", url: absoluteUrl("/sports") },
        ],
      })}
    />
  );
}

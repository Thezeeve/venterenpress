import type { Metadata } from "next";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Finance News",
  description: "Markets, rates, capital flows, and the financial signals driving investor decisions.",
  path: "/finance",
});

export default async function FinancePage() {
  const stories = await getSectionStories("finance");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Finance"
      description="Markets, rates, capital flows, and the financial signals driving investor decisions."
      stories={stories}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Finance" },
      ]}
      structuredData={buildListingPageStructuredData({
        title: "Finance News",
        description: "Markets, rates, capital flows, and the financial signals driving investor decisions.",
        url: absoluteUrl("/finance"),
        breadcrumbs: [
          { name: "Home", url: absoluteUrl("/") },
          { name: "Finance", url: absoluteUrl("/finance") },
        ],
      })}
    />
  );
}

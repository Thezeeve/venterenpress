import type { Metadata } from "next";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Entertainment News",
  description: "Streaming, media strategy, and cultural industry coverage with a clean editorial focus.",
  path: "/entertainment",
});

export default async function EntertainmentPage() {
  const stories = await getSectionStories("entertainment");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Entertainment"
      description="Streaming, media strategy, and cultural industry coverage with a clean editorial focus."
      stories={stories}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Entertainment" },
      ]}
      structuredData={buildListingPageStructuredData({
        title: "Entertainment News",
        description: "Streaming, media strategy, and cultural industry coverage with a clean editorial focus.",
        url: absoluteUrl("/entertainment"),
        breadcrumbs: [
          { name: "Home", url: absoluteUrl("/") },
          { name: "Entertainment", url: absoluteUrl("/entertainment") },
        ],
      })}
    />
  );
}

import type { Metadata } from "next";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata, getSectionSeoCopy } from "@/lib/seo";

export const dynamic = "force-dynamic";

const seo = getSectionSeoCopy("business");

export const metadata: Metadata = buildPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/business",
});

export default async function BusinessPage() {
  const stories = await getSectionStories("business");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Business"
      description="Corporate strategy, economic shifts, and boardroom reporting from across the global economy."
      stories={stories}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Business" },
      ]}
      structuredData={buildListingPageStructuredData({
        title: seo.title,
        description: seo.description,
        url: absoluteUrl("/business"),
        breadcrumbs: [
          { name: "Home", url: absoluteUrl("/") },
          { name: "Business", url: absoluteUrl("/business") },
        ],
      })}
    />
  );
}

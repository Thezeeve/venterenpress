import type { Metadata } from "next";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata, getSectionSeoCopy } from "@/lib/seo";

export const dynamic = "force-dynamic";

const seo = getSectionSeoCopy("opinion");

export const metadata: Metadata = buildPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/opinion",
});

export default async function OpinionPage() {
  const stories = await getSectionStories("opinion");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Opinion"
      description="Sharp analysis, informed arguments, and perspective pieces from the VANTERENPRESS newsroom."
      stories={stories}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Opinion" },
      ]}
      structuredData={buildListingPageStructuredData({
        title: seo.title,
        description: seo.description,
        url: absoluteUrl("/opinion"),
        breadcrumbs: [
          { name: "Home", url: absoluteUrl("/") },
          { name: "Opinion", url: absoluteUrl("/opinion") },
        ],
      })}
    />
  );
}

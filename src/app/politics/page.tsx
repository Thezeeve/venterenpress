import type { Metadata } from "next";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getTopicStories } from "@/lib/public-story-feed";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata, getSectionSeoCopy } from "@/lib/seo";

export const dynamic = "force-dynamic";

const seo = getSectionSeoCopy("politics");

export const metadata: Metadata = buildPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/politics",
});

export default async function PoliticsPage() {
  const stories = (await getTopicStories("politics")) ?? [];

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Politics"
      description="Government, elections, legislation, and power shifts shaping the public agenda."
      stories={stories}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Politics" },
      ]}
      structuredData={buildListingPageStructuredData({
        title: seo.title,
        description: seo.description,
        url: absoluteUrl("/politics"),
        breadcrumbs: [
          { name: "Home", url: absoluteUrl("/") },
          { name: "Politics", url: absoluteUrl("/politics") },
        ],
      })}
    />
  );
}

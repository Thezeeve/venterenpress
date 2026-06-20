import type { Metadata } from "next";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getSectionStories } from "@/lib/public-story-feed";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata, getSectionSeoCopy } from "@/lib/seo";

export const dynamic = "force-dynamic";

const seo = getSectionSeoCopy("world");

export const metadata: Metadata = buildPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/world",
});

export default async function WorldPage() {
  const stories = await getSectionStories("world");

  return (
    <PublicStoryListingPage
      badge="Section"
      title="World"
      description="International coverage, geopolitics, diplomacy, and major global developments."
      stories={stories}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "World" },
      ]}
      structuredData={buildListingPageStructuredData({
        title: seo.title,
        description: seo.description,
        url: absoluteUrl("/world"),
        breadcrumbs: [
          { name: "Home", url: absoluteUrl("/") },
          { name: "World", url: absoluteUrl("/world") },
        ],
      })}
    />
  );
}

import type { Metadata } from "next";
import { PublicStoryListingPage } from "@/components/newsroom/public-story-listing-page";
import { getTopicStories } from "@/lib/public-story-feed";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata, getSectionSeoCopy } from "@/lib/seo";

export const dynamic = "force-dynamic";

const seo = getSectionSeoCopy("crypto");

export const metadata: Metadata = buildPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/crypto",
});

export default async function CryptoPage() {
  const stories = (await getTopicStories("crypto")) ?? [];

  return (
    <PublicStoryListingPage
      badge="Section"
      title="Crypto"
      description="Digital asset markets, regulation, blockchain infrastructure, and crypto industry developments."
      stories={stories}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Crypto" },
      ]}
      structuredData={buildListingPageStructuredData({
        title: seo.title,
        description: seo.description,
        url: absoluteUrl("/crypto"),
        breadcrumbs: [
          { name: "Home", url: absoluteUrl("/") },
          { name: "Crypto", url: absoluteUrl("/crypto") },
        ],
      })}
    />
  );
}

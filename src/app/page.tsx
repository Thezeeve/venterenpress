import type { Metadata } from "next";
import { HomepageClient } from "@/components/home/homepage-client";
import { StructuredDataScript } from "@/components/seo/structured-data-script";
import { getHomepageNewsResponse, getNewsRefreshIntervalMinutes } from "@/lib/news-providers";
import { getPersonalizedNewsroom } from "@/lib/newsroom";
import { absoluteUrl, buildListingPageStructuredData, buildPageMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Global News, Politics, Business and Technology",
  description:
    "VANTERENPRESS delivers international breaking news, politics, business, technology, crypto, and opinion coverage from a global newsroom.",
  path: "/",
});

export default async function Home() {
  const [newsResponse, user] = await Promise.all([
    getHomepageNewsResponse(),
    getCurrentUser(),
  ]);

  const personalized = await getPersonalizedNewsroom(user?.id).catch(() => null);

  return (
    <>
      <StructuredDataScript
        data={buildListingPageStructuredData({
          title: "Global News, Politics, Business and Technology",
          description:
            "VANTERENPRESS delivers international breaking news, politics, business, technology, crypto, and opinion coverage from a global newsroom.",
          url: absoluteUrl("/"),
          breadcrumbs: [{ name: "Home", url: absoluteUrl("/") }],
        })}
      />
      <HomepageClient
        initialNewsResponse={newsResponse}
        refreshIntervalMinutes={getNewsRefreshIntervalMinutes()}
        personalized={personalized}
      />
    </>
  );
}

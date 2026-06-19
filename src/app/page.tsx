import { HomepageClient } from "@/components/home/homepage-client";
import { getHomepageNewsResponse, getNewsRefreshIntervalMinutes } from "@/lib/news-providers";
import { getPersonalizedNewsroom } from "@/lib/newsroom";
import { getCurrentUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [newsResponse, user] = await Promise.all([
    getHomepageNewsResponse(),
    getCurrentUser(),
  ]);

  const personalized = await getPersonalizedNewsroom(user?.id).catch(() => null);

  return (
    <HomepageClient
      initialNewsResponse={newsResponse}
      refreshIntervalMinutes={getNewsRefreshIntervalMinutes()}
      personalized={personalized}
    />
  );
}

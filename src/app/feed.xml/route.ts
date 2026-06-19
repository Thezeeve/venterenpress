import { isDatabaseAvailable } from "@/lib/database-availability";
import { prisma } from "@/lib/prisma";
import { seededEditorialStories } from "@/lib/news-providers/seed-content";
import { siteConfig } from "@/lib/site";

export async function GET() {
  const articles = await (async () => {
    if (!await isDatabaseAvailable()) {
      return seededEditorialStories.slice(0, 20).map((story) => ({
        title: story.title,
        slug: story.slug,
        excerpt: story.summary,
        publishedAt: new Date(story.publishedAt),
      }));
    }

    try {
      return await prisma.article.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        orderBy: { publishedAt: "desc" },
        take: 20,
      });
    } catch {
      return seededEditorialStories.slice(0, 20).map((story) => ({
        title: story.title,
        slug: story.slug,
        excerpt: story.summary,
        publishedAt: new Date(story.publishedAt),
      }));
    }
  })();

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${siteConfig.name}</title>
    <description>${siteConfig.description}</description>
    <link>${siteConfig.url}</link>
    ${articles
      .map(
        (article) => `<item>
      <title><![CDATA[${article.title}]]></title>
      <link>${siteConfig.url}/articles/${article.slug}</link>
      <guid>${siteConfig.url}/articles/${article.slug}</guid>
      <description><![CDATA[${article.excerpt ?? ""}]]></description>
      <pubDate>${article.publishedAt?.toUTCString() ?? new Date().toUTCString()}</pubDate>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

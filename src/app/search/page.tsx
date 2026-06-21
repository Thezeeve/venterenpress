import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SearchBox } from "@/components/search/search-box";
import { PublicStoryCard } from "@/components/newsroom/public-story-card";
import { isDatabaseAvailable } from "@/lib/database-availability";
import {
  dedupePublicStoriesById,
  dedupePublicStoryImages,
  formatPublicStoryDate,
  getHomepageFallbackStories,
  toPublicStoryFromArticle,
} from "@/lib/public-story-feed";
import type { NewsroomArticleCard } from "@/lib/newsroom";
import { prisma } from "@/lib/prisma";
import { searchArticles } from "@/lib/search";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : undefined;
  const editionId = typeof params.editionId === "string" ? params.editionId : undefined;
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : undefined;
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : undefined;

  const { results, editions, categories } = await (async () => {
    if (!await isDatabaseAvailable()) {
      const fallbackStories = await getHomepageFallbackStories();
      const filtered = fallbackStories.filter((story) => {
        const matchesQuery = query
          ? `${story.title} ${story.summary} ${story.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())
          : true;
        const matchesCategory = category
          ? story.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") === category
          : true;
        const matchesRegion = editionId
          ? story.region.toLowerCase().replace(/[^a-z0-9]+/g, "-") === editionId.toLowerCase()
          : true;
        const publishedAt = new Date(story.publishedAt).getTime();
        const matchesDateFrom = dateFrom ? publishedAt >= new Date(dateFrom).getTime() : true;
        const matchesDateTo = dateTo ? publishedAt <= new Date(dateTo).getTime() : true;
        return matchesQuery && matchesCategory && matchesRegion && matchesDateFrom && matchesDateTo;
      });

      return {
        results: filtered.map((story) => ({
          id: story.id,
          slug: story.slug,
          title: story.title,
          excerpt: story.summary,
          articleType: "NEWS",
          accessTier: "FREE",
          featuredImageUrl: story.featuredImageUrl,
          featuredImageAlt: story.featuredImageAlt,
          publishedAt: new Date(story.publishedAt),
          edition: {
            id: story.region.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: story.region,
            code: story.region.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
            region: story.region,
          },
          author: {
            id: story.id,
            name: story.author.name,
            email: null,
            bio: null,
            isVerifiedJournalist: false,
          },
          categories: [{
            category: {
              id: story.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              slug: story.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              name: story.category,
            },
          }],
          tags: [],
        })),
        editions: [...new Map(fallbackStories.map((story) => [story.region, story.region])).values()].map((region) => ({
          id: region.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: region,
        })),
        categories: [...new Map(fallbackStories.map((story) => [story.category, story.category])).values()].map((name) => ({
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name,
        })),
      };
    }

    try {
      const [resolvedResults, resolvedEditions, resolvedCategories] = await Promise.all([
        searchArticles({ query, category, editionId, dateFrom, dateTo }),
        prisma.edition.findMany({ orderBy: { name: "asc" } }),
        prisma.category.findMany({ orderBy: { name: "asc" } }),
      ]);

      return {
        results: resolvedResults,
        editions: resolvedEditions,
        categories: resolvedCategories,
      };
    } catch {
      return {
        results: [],
        editions: [],
        categories: [],
      };
    }
  })();

  const storyCards = dedupePublicStoryImages(
    dedupePublicStoriesById((results as NewsroomArticleCard[]).map((article) => toPublicStoryFromArticle(article))),
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3">
        <h1 className="font-serif text-5xl">Search {siteConfig.name}</h1>
        <p className="max-w-3xl text-[var(--muted-foreground)]">
          Search by keyword, category, region, and date across published VANTERENPRESS stories.
        </p>
      </div>
      <form className="grid gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5 lg:grid-cols-4">
        <SearchBox name="q" defaultValue={query} />
        <Select name="category" defaultValue={category}>
          <option value="">All categories</option>
          {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </Select>
        {editions.length ? (
          <Select name="editionId" defaultValue={editionId}>
            <option value="">All regions</option>
            {editions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        ) : (
          <div />
        )}
        <button type="submit" className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white">Search</button>
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <Input type="date" name="dateFrom" defaultValue={dateFrom} />
          <Input type="date" name="dateTo" defaultValue={dateTo} />
        </div>
      </form>

      <section className="mt-8">
        {storyCards.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {storyCards.map((story) => (
              <PublicStoryCard
                key={story.id}
                href={story.href}
                title={story.title}
                excerpt={story.excerpt}
                category={story.category}
                publishedLabel={`Published ${formatPublicStoryDate(story.publishedAt)}`}
                imageUrl={story.imageUrl}
                imageAlt={story.imageAlt}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No search matches" description="Try broader keywords, remove a filter, or search another section." />
        )}
      </section>
    </main>
  );
}

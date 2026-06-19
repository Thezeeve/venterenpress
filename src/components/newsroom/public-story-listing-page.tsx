import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicStoryCard } from "@/components/newsroom/public-story-card";
import { dedupePublicStoryImages, formatPublicStoryDate, type PublicStoryFeedItem } from "@/lib/public-story-feed";

export function PublicStoryListingPage({
  badge,
  title,
  description,
  stories,
  emptyDescription = "No stories available in this section yet.",
}: {
  badge: string;
  title: string;
  description: string;
  stories: PublicStoryFeedItem[];
  emptyDescription?: string;
}) {
  const dedupedStories = dedupePublicStoryImages(stories);

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-4xl space-y-5">
        <Badge>{badge}</Badge>
        <h1 className="font-serif text-5xl leading-[1.04] tracking-[-0.02em]">{title}</h1>
        <p className="max-w-3xl text-[1.02rem] leading-[1.95] text-[var(--muted-foreground)]">{description}</p>
      </div>

      <section className="mt-12 lg:mt-14">
        {dedupedStories.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {dedupedStories.map((story) => (
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
          <EmptyState title="No stories available" description={emptyDescription} />
        )}
      </section>
    </main>
  );
}

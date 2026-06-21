import Link from "next/link";
import { ArrowRight, Clock3, Globe2, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { NewsroomArticleCard } from "@/lib/newsroom";
import { dedupeNewsroomArticlesById, filterRenderableNewsroomArticles } from "@/lib/public-story-feed";

export function DiscoveryPage({
  badge,
  title,
  description,
  articles,
  sidebarTitle,
  sidebarDescription,
  sidebarLinks,
}: {
  badge: string;
  title: string;
  description: string;
  articles: NewsroomArticleCard[];
  sidebarTitle: string;
  sidebarDescription: string;
  sidebarLinks: { label: string; href: string }[];
}) {
  const dedupedArticles = dedupeNewsroomArticlesById(filterRenderableNewsroomArticles(articles));

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <Badge>{badge}</Badge>
          <h1 className="font-serif text-5xl leading-tight">{title}</h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">{description}</p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Coverage", `${dedupedArticles.length} live stories`],
              ["Format", "Category, region, and topic landing layout"],
              ["Trust", "Structured metadata, source notes, and review labels"],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardContent className="p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{label}</div>
                  <div className="mt-2 text-lg font-semibold">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>{sidebarTitle}</CardTitle>
            <CardDescription>{sidebarDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 text-sm transition hover:bg-[var(--muted)]"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Coverage feed</CardTitle>
            <CardDescription>Chronological stories from this desk or edition.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dedupedArticles.length ? (
              dedupedArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="block rounded-[28px] border border-[var(--border)] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                    <span>{article.categories[0]?.category.name ?? article.articleType}</span>
                    <span>&bull;</span>
                    <span>{article.edition.name}</span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {article.readingTimeMinutes} min read
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">{article.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{article.excerpt}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
                    <span>{article.author.name ?? article.author.email}</span>
                    {article.author.isVerifiedJournalist ? <Badge variant="neutral">Verified journalist</Badge> : null}
                    {article.tags[0]?.tag ? (
                      <span className="inline-flex items-center gap-1">
                        <Tags className="h-3.5 w-3.5" />
                        {article.tags[0].tag.name}
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                title="No articles yet"
                description="This landing page will populate once published stories match the selected topic, region, or section."
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick access</CardTitle>
            <CardDescription>Fast links for readers and editors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-[24px] bg-[var(--muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                <Globe2 className="h-4 w-4 text-[var(--accent)]" />
                Edition-aware discovery
              </div>
              <p className="mt-2">
                These landing pages behave like newsroom hubs, with reader pathways into sections, editions, and subscriptions.
              </p>
            </div>
            {[
              { label: "Latest news", href: "/latest" },
              { label: "Most read", href: "/most-read" },
              { label: "Search", href: "/search" },
              { label: "Pricing", href: "/pricing" },
              { label: "Subscribe", href: "/subscribe" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-2xl bg-[var(--muted)] px-4 py-3">
                {link.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

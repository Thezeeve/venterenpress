import Link from "next/link";
import { HomepageHeroButton } from "@/components/editor/homepage-hero-button";
import { NewsroomEditor } from "@/components/editor/newsroom-editor";
import { ArticleStatusBadge } from "@/components/dashboard/article-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireDashboardUser } from "@/lib/server-auth";
import { normalizeSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isDemoArticle(article: {
  slug: string;
  author: { email: string | null };
}) {
  return (
    (article.author.email ?? "").endsWith("@globalpress.network")
    || article.slug.startsWith("seeded-admin-")
    || article.slug.startsWith("seed-")
  );
}

function formatUpdatedAt(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default async function EditorDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const user = await requireDashboardUser("articleCreate");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = String(resolvedSearchParams?.q ?? "").trim();
  const normalizedQuery = normalizeSlug(query);
  const [articles, categories, editions] = await Promise.all([
    prisma.article.findMany({
      where: {
        deletedAt: null,
        ...(query
          ? {
              OR: [
                { slug: normalizedQuery || query.toLowerCase() },
                { slug: { contains: normalizedQuery || query.toLowerCase(), mode: "insensitive" } },
                { title: { contains: query, mode: "insensitive" } },
                { excerpt: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        author: true,
        edition: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: query ? 24 : 12,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.edition.findMany({ orderBy: { name: "asc" } }),
  ]);

  const visibleArticles = articles.filter((article) => !isDemoArticle(article));
  const recentArticles = query ? visibleArticles : visibleArticles.slice(0, 6);

  return (
    <main
      data-platform-dashboard
      className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10"
    >
      <div className="flex flex-col gap-4 border-b border-[rgba(15,23,42,0.08)] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Badge>Editor workspace</Badge>
          <h1 className="font-serif text-3xl leading-tight text-[var(--foreground)] sm:text-[2.15rem]">
            Editorial Dashboard
          </h1>
          <p className="text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
            Create, manage, and publish newsroom content.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/admin/articles/new">New Article</Link></Button>
        </div>
      </div>

      <NewsroomEditor
        categoryOptions={categories.map((item) => ({ label: item.name, value: item.slug }))}
        editionOptions={editions.map((item) => ({ label: item.name, value: item.code }))}
        currentUserRole={user.role}
      />

      <section className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {query ? "Search Results" : "Recent Articles"}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {query
                ? "Find an existing article by slug, title, or excerpt and open it without recreating the record."
                : "Open recent drafts and published pieces without leaving the editorial workspace."}
            </p>
          </div>
          <form className="flex flex-col gap-3 sm:flex-row" action="/dashboard/editor" method="get">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search by article slug or title"
              aria-label="Search articles by slug or title"
              className="h-11"
            />
            <div className="flex gap-3">
              <Button type="submit" variant="outline">Find Article</Button>
              {query ? (
                <Button asChild variant="ghost">
                  <Link href="/dashboard/editor">Clear</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </div>
        <Card className="rounded-[30px] border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.8)] shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <CardContent className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2">
            {recentArticles.length ? recentArticles.map((article) => (
              <div
                key={article.id}
                className="rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-white/88 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold leading-7 text-[var(--foreground)]">{article.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--muted-foreground)]">
                      <span>{article.categories[0]?.category.name ?? "Uncategorized"}</span>
                      <span>Updated {formatUpdatedAt(article.updatedAt)}</span>
                      {article.showOnHero ? <Badge variant="neutral">Homepage Hero</Badge> : null}
                    </div>
                  </div>
                  <ArticleStatusBadge status={article.status} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/articles/${article.id}/edit`}>Edit</Link>
                  </Button>
                  <HomepageHeroButton
                    articleId={article.id}
                    isHomepageHero={article.showOnHero}
                    disabled={article.status !== "PUBLISHED"}
                    compact
                  />
                </div>
              </div>
            )) : (
              <EmptyState
                title={query ? "No matching articles" : "No recent articles"}
                description={
                  query
                    ? "No existing article matched that slug or title. Refine the search before creating anything new."
                    : "Newly created drafts and published newsroom stories will appear here."
                }
              />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsroomEditor } from "@/components/editor/newsroom-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getArticleById, getHomepageHeroArticleId } from "@/lib/articles";
import { prisma } from "@/lib/prisma";
import { requireDashboardUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function EditAdminArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireDashboardUser("articleEdit");
  const { id } = await params;
  const [article, categories, editions, homepageHeroArticleId] = await Promise.all([
    getArticleById(id),
    prisma.category.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    prisma.edition.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    getHomepageHeroArticleId().catch(() => null),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge>Admin</Badge>
          <h1 className="font-serif text-4xl">Edit article</h1>
          <p className="max-w-3xl text-[var(--muted-foreground)]">
            Update the article, review the public preview, and publish from the same protected workspace.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/articles/${article.slug}`}>Open public article</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{article.title}</CardTitle>
          <CardDescription>{article.status} workflow state</CardDescription>
        </CardHeader>
        <CardContent>
          <NewsroomEditor
            articleId={article.id}
            initialArticle={{
              id: article.id,
              title: article.title,
              slug: article.slug,
              excerpt: article.excerpt ?? "",
              body: article.body,
              seoTitle: article.seoTitle,
              seoDescription: article.seoDescription,
              status: article.status,
              editionCode: article.edition.code,
              categorySlugs: article.categories.map((item) => item.category.slug),
              tagSlugs: article.tags.map((item) => item.tag.slug),
              featuredImageUrl: article.featuredImageUrl,
              featuredImageAlt: article.featuredImageAlt,
              isHomepageHero: homepageHeroArticleId === article.id,
            }}
            categoryOptions={categories.map((item) => ({ label: item.name, value: item.slug }))}
            editionOptions={editions.map((item) => ({ label: item.name, value: item.code }))}
            currentUserRole={user.role}
          />
        </CardContent>
      </Card>
    </main>
  );
}

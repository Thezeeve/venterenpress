import { BadgeCheck, Newspaper } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowJournalistButton } from "@/components/article/follow-journalist-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const author = await prisma.user.findUnique({
    where: { id },
    include: {
      authoredArticles: {
        where: { deletedAt: null, status: "PUBLISHED" },
        include: {
          edition: true,
          categories: { include: { category: true } },
        },
        orderBy: { publishedAt: "desc" },
      },
      followedBy: true,
    },
  });

  if (!author) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <BadgeCheck className="h-5 w-5" />
              <span className="text-sm font-medium">
                {author.isVerifiedJournalist ? "Verified newsroom profile" : "Journalist profile"}
              </span>
            </div>
            <h1 className="mt-5 font-serif text-4xl">{author.name ?? author.email}</h1>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
              {author.bio ?? "Verified newsroom profile with archive access and audience follow controls."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge>{author.role.replaceAll("_", " ")}</Badge>
              <Badge variant="neutral">{author.followedBy.length} followers</Badge>
            </div>
            {author.contractUrl || author.contractNotes ? (
              <div className="mt-6 rounded-2xl border border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
                <div className="font-medium text-[var(--foreground)]">Contract and permissions</div>
                <div className="mt-2">Contract: {author.contractUrl ?? "Not shared"}</div>
                <div className="mt-1">Notes: {author.contractNotes ?? "No contract notes stored."}</div>
              </div>
            ) : null}
            <div className="mt-6">
              <FollowJournalistButton journalistId={author.id} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest reporting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {author.authoredArticles.length ? (
              author.authoredArticles.map((article) => (
                <Link key={article.id} href={`/articles/${article.slug}`} className="block rounded-[24px] border border-[var(--border)] p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                    <Newspaper className="h-4 w-4" />
                    {article.categories[0]?.category.name ?? article.articleType}
                  </div>
                  <h2 className="font-serif text-2xl">{article.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{article.excerpt}</p>
                  <div className="mt-3 text-sm text-[var(--muted-foreground)]">{article.edition.name}</div>
                </Link>
              ))
            ) : (
              <EmptyState title="No published archive yet" description="This newsroom profile will list published stories, beats, and archives once they are available." />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

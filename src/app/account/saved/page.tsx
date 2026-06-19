import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SavedArticlesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    include: { article: { include: { author: true, edition: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Saved articles</Badge>
      <h1 className="mt-4 font-serif text-5xl">Your reading list</h1>
      <Card className="mt-8">
        <CardHeader><CardTitle>Bookmarks</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {bookmarks.length ? bookmarks.map((bookmark) => (
            <Link key={bookmark.articleId} href={`/articles/${bookmark.article.slug}`} className="block rounded-[24px] border border-[var(--border)] p-5">
              <div className="font-serif text-2xl">{bookmark.article.title}</div>
              <div className="mt-1 text-sm text-[var(--muted-foreground)]">{bookmark.article.edition.name} | {bookmark.article.author.name ?? bookmark.article.author.email}</div>
            </Link>
          )) : <EmptyState title="No saved articles" description="Bookmark premium investigations, briefing notes, and follow-up stories to build your reading list." />}
        </CardContent>
      </Card>
    </main>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TagsIndexPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { articles: true },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Tags</Badge>
      <h1 className="mt-4 font-serif text-5xl">Topic tags</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tags.map((tag) => (
          <Link key={tag.id} href={`/tags/${tag.slug}`}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{tag.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted-foreground)]">
                {tag.articles.length} articles
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}


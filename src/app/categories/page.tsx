import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getHomepageFallbackStories } from "@/lib/public-story-feed";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoriesIndexPage() {
  const categories = await (async () => {
    if (!await isDatabaseAvailable()) {
      const fallbackStories = await getHomepageFallbackStories();
      const grouped = new Map<string, { id: string; slug: string; name: string; description: string | null; articles: { length: number } }>();
      fallbackStories.forEach((story) => {
        const slug = story.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const current = grouped.get(slug);
        if (current) {
          current.articles.length += 1;
          return;
        }
        grouped.set(slug, {
          id: slug,
          slug,
          name: story.category,
          description: null,
          articles: { length: 1 },
        });
      });
      return [...grouped.values()];
    }

    try {
      return await prisma.category.findMany({
        orderBy: [{ isBreaking: "desc" }, { name: "asc" }],
        include: { articles: true },
      });
    } catch {
      return [];
    }
  })();

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Categories</Badge>
      <h1 className="mt-4 font-serif text-5xl">News sections</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={`/categories/${category.slug}`}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted-foreground)]">
                {category.description ?? "Editorial coverage and related article collections."}
                <div className="mt-3">{category.articles.length} articles</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

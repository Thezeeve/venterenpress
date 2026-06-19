import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function TopicsIndexPage() {
  const [categories, tags] = await (async () => {
    if (!await isDatabaseAvailable()) {
      return [
        siteConfig.nav.map((name) => ({ id: name, slug: name.toLowerCase().replace(/\s+/g, "-"), name })),
        ["AI Infrastructure", "Climate Risk", "Global Markets"].map((name) => ({ id: name, slug: name.toLowerCase().replace(/\s+/g, "-"), name })),
      ] as const;
    }

    try {
      return await Promise.all([
        prisma.category.findMany({ orderBy: { name: "asc" } }),
        prisma.tag.findMany({ orderBy: { name: "asc" } }),
      ]);
    } catch {
      return [
        siteConfig.nav.map((name) => ({ id: name, slug: name.toLowerCase().replace(/\s+/g, "-"), name })),
        ["AI Infrastructure", "Climate Risk", "Global Markets"].map((name) => ({ id: name, slug: name.toLowerCase().replace(/\s+/g, "-"), name })),
      ] as const;
    }
  })();

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Topics</Badge>
      <h1 className="mt-4 font-serif text-5xl">Editorial topic pages</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Category topics</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {categories.map((category) => (
              <Link key={category.id} href={`/topics/${category.slug}`} className="rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm">
                {category.name}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tag topics</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {tags.map((tag) => (
              <Link key={tag.id} href={`/topics/${tag.slug}`} className="rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm">
                {tag.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getRegionSummaries } from "@/lib/public-story-feed";

export const dynamic = "force-dynamic";

export default async function RegionsIndexPage() {
  const regions = await getRegionSummaries();

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Regions</Badge>
      <h1 className="mt-4 font-serif text-5xl">Regional editions</h1>
      {regions.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {regions.map((region) => (
            <Link key={region.slug} href={`/regions/${region.slug}`}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{region.region}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--muted-foreground)]">
                  <div>{region.count} stories</div>
                  <div className="mt-3 leading-6 text-[var(--foreground)]">{region.lead?.title}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="Regional editions are coming soon" description="Regional editions are coming soon." />
        </div>
      )}
    </main>
  );
}

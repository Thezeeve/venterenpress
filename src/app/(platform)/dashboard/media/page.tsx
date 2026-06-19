import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MediaDashboardPage() {
  const media = await prisma.mediaAsset.findMany({
    include: {
      article: true,
      uploader: true,
    },
    orderBy: { createdAt: "desc" },
    take: 18,
  });

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Media library</Badge>
        <h1 className="font-serif text-4xl">S3-compatible asset operations</h1>
        <p className="max-w-3xl text-[var(--muted-foreground)]">
          Presigned uploads, optimization metadata, author photos, podcast covers, and article-linked media assets.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Media assets</CardTitle>
          <CardDescription>Uploaded through the media presign endpoint and tracked in Prisma.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {media.length ? (
            media.map((asset) => (
              <div key={asset.id} className="rounded-[24px] border border-[var(--border)] p-5">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">{asset.type}</div>
                <div className="font-semibold">{asset.title}</div>
                <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {asset.uploader?.name ?? asset.uploader?.email ?? "Unknown uploader"} | {asset.processingStatus}
                </div>
                <div className="mt-1 text-xs text-[var(--muted-foreground)]">{asset.url}</div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No media uploaded"
              description="Use the media presign API to upload article images, thumbnails, author photos, video, and audio assets."
              className="md:col-span-2 xl:col-span-3"
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}

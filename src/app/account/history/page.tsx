import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReadingHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const history = await prisma.readerAccessEvent.findMany({
    where: { userId: user.id },
    include: { article: { include: { edition: true } } },
    orderBy: { viewedAt: "desc" },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Reading history</Badge>
      <h1 className="mt-4 font-serif text-5xl">Recent reading</h1>
      <Card className="mt-8">
        <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {history.length ? history.map((item) => (
            <div key={item.id} className="rounded-[24px] border border-[var(--border)] p-5">
              <div className="font-serif text-2xl">{item.article.title}</div>
              <div className="mt-1 text-sm text-[var(--muted-foreground)]">{item.article.edition.name} | {formatDistanceToNow(item.viewedAt, { addSuffix: true })}</div>
            </div>
          )) : <EmptyState title="No reading history" description="Your article visits will appear here once you start reading on the platform." />}
        </CardContent>
      </Card>
    </main>
  );
}

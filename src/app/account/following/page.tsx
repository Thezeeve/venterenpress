import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FollowedAuthorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const follows = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: { journalist: { include: { authoredArticles: { where: { deletedAt: null, status: "PUBLISHED" }, take: 1, orderBy: { publishedAt: "desc" } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Followed authors</Badge>
      <h1 className="mt-4 font-serif text-5xl">Journalists you follow</h1>
      <Card className="mt-8">
        <CardHeader><CardTitle>Follow list</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {follows.length ? follows.map((follow) => (
            <Link key={`${follow.followerId}-${follow.journalistId}`} href={`/authors/${follow.journalistId}`} className="block rounded-[24px] border border-[var(--border)] p-5">
              <div className="font-serif text-2xl">{follow.journalist.name ?? follow.journalist.email}</div>
              <div className="mt-1 text-sm text-[var(--muted-foreground)]">{follow.journalist.bio ?? "Verified newsroom profile"}</div>
            </Link>
          )) : <EmptyState title="No follows yet" description="Follow journalists to build a personalized reporting feed and profile archive." />}
        </CardContent>
      </Card>
    </main>
  );
}

import { NewsroomEditor } from "@/components/editor/newsroom-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireDashboardUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function NewAdminArticlePage() {
  const user = await requireDashboardUser("articleCreate");
  const [categories, editions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    prisma.edition.findMany({ orderBy: { name: "asc" } }).catch(() => []),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge>Admin</Badge>
        <h1 className="font-serif text-4xl">New article</h1>
        <p className="max-w-3xl text-[var(--muted-foreground)]">
          Create, preview, save, and publish newsroom articles from a protected editorial workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article workspace</CardTitle>
          <CardDescription>Title, slug, section, body, image, and publish controls.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewsroomEditor
            categoryOptions={categories.map((item) => ({ label: item.name, value: item.slug }))}
            editionOptions={editions.map((item) => ({ label: item.name, value: item.code }))}
            currentUserRole={user.role}
          />
        </CardContent>
      </Card>
    </main>
  );
}

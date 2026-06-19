import { notFound } from "next/navigation";
import { DiscoveryPage } from "@/components/discovery/discovery-page";
import { prisma } from "@/lib/prisma";
import { newsroomArticleInclude } from "@/lib/newsroom";

export const dynamic = "force-dynamic";

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug } });

  if (!tag) {
    notFound();
  }

  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      tags: { some: { tagId: tag.id } },
    },
    include: newsroomArticleInclude,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: 18,
  });

  return (
    <DiscoveryPage
      badge="Tag"
      title={tag.name}
      description={`Articles and analysis tagged with ${tag.name}.`}
      articles={articles}
      sidebarTitle="Related routes"
      sidebarDescription="Browse adjacent topic surfaces."
      sidebarLinks={[
        { label: "Categories", href: "/categories" },
        { label: "Regions", href: "/regions" },
        { label: "Latest news", href: "/latest" },
      ]}
    />
  );
}


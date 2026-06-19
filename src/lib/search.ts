import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SearchFilters = {
  query?: string;
  category?: string;
  authorId?: string;
  editionId?: string;
  articleType?: string;
  dateFrom?: string;
  dateTo?: string;
};

export interface SearchAdapter {
  name: string;
  searchArticles(filters: SearchFilters): Promise<unknown[]>;
}

class PostgresSearchAdapter implements SearchAdapter {
  name = "postgres";

  async searchArticles(filters: SearchFilters) {
    const where: Prisma.ArticleWhereInput = {
      deletedAt: null,
      status: "PUBLISHED",
      ...(filters.query
        ? {
            OR: [
              { title: { contains: filters.query, mode: "insensitive" } },
              { excerpt: { contains: filters.query, mode: "insensitive" } },
              { seoDescription: { contains: filters.query, mode: "insensitive" } },
              { categories: { some: { category: { name: { contains: filters.query, mode: "insensitive" } } } } },
              { tags: { some: { tag: { name: { contains: filters.query, mode: "insensitive" } } } } },
            ],
          }
        : {}),
      ...(filters.category
        ? { categories: { some: { category: { slug: filters.category } } } }
        : {}),
      ...(filters.editionId ? { editionId: filters.editionId } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            publishedAt: {
              gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
              lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
            },
          }
        : {}),
    };

    return prisma.article.findMany({
      where,
      take: 24,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      include: {
        author: true,
        edition: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
  }
}

export function getSearchAdapter(): SearchAdapter {
  switch (process.env.SEARCH_PROVIDER) {
    case "MEILISEARCH":
    case "TYPESENSE":
    case "ELASTICSEARCH":
      return new PostgresSearchAdapter();
    default:
      return new PostgresSearchAdapter();
  }
}

export async function searchArticles(filters: SearchFilters) {
  return getSearchAdapter().searchArticles(filters);
}

export async function syncArticleSearchDocument(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: true,
      edition: true,
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!article) {
    return null;
  }

  return prisma.searchDocument.upsert({
    where: {
      entityType_entityId: {
        entityType: "article",
        entityId: article.id,
      },
    },
    update: {
      title: article.title,
      excerpt: article.excerpt,
      content: JSON.stringify(article.body),
      filters: {
        authorId: article.authorId,
        editionId: article.editionId,
        categories: article.categories.map((item) => item.category.slug),
        tags: article.tags.map((item) => item.tag.slug),
        articleType: article.articleType,
      },
    },
    create: {
      entityType: "article",
      entityId: article.id,
      title: article.title,
      excerpt: article.excerpt,
      content: JSON.stringify(article.body),
      filters: {
        authorId: article.authorId,
        editionId: article.editionId,
        categories: article.categories.map((item) => item.category.slug),
        tags: article.tags.map((item) => item.tag.slug),
        articleType: article.articleType,
      },
    },
  });
}

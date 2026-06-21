import { revalidatePath } from "next/cache";
import { ArticleStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createArticle, formatArticleMutationError, listArticles } from "@/lib/articles";
import { validateBrowserMutation } from "@/lib/security";
import { requireApiUser } from "@/lib/server-auth";
import { articleInputSchema } from "@/lib/validation";

function revalidateArticlePaths(input: {
  slugs?: string[];
  categorySlugs?: string[];
  tagSlugs?: string[];
}) {
  const paths = new Set<string>([
    "/",
    "/latest",
    "/search",
    "/categories",
    "/topics",
    "/tags",
    "/feed.xml",
    "/sitemap.xml",
  ]);

  input.slugs?.filter(Boolean).forEach((slug) => {
    paths.add(`/articles/${slug}`);
  });

  input.categorySlugs?.filter(Boolean).forEach((slug) => {
    paths.add(`/categories/${slug}`);
    paths.add(`/${slug}`);
    paths.add(`/topics/${slug}`);
  });

  input.tagSlugs?.filter(Boolean).forEach((slug) => {
    paths.add(`/tags/${slug}`);
    paths.add(`/topics/${slug}`);
    paths.add(`/${slug}`);
  });

  paths.forEach((path) => revalidatePath(path));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const authorId = searchParams.get("authorId") ?? undefined;
  const statuses = searchParams.getAll("status").filter(Boolean) as ArticleStatus[];

  const articles = await listArticles({
    q,
    authorId,
    statuses,
  });

  return NextResponse.json({ data: articles });
}

export async function POST(request: NextRequest) {
  const browserCheck = validateBrowserMutation(request);
  if (!browserCheck.ok) {
    return NextResponse.json({ error: browserCheck.error }, { status: 403 });
  }

  const auth = await requireApiUser("articleCreate");
  if (!auth.ok) {
    return auth.response;
  }

  const payload = await request.json();
  const parsed = articleInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid article payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const article = await createArticle({
      actor: {
        id: auth.user.id,
        role: auth.user.role,
      },
      data: parsed.data,
    });

    revalidateArticlePaths({
      slugs: [article.slug],
      categorySlugs: parsed.data.categorySlugs,
      tagSlugs: parsed.data.tagSlugs,
    });

    return NextResponse.json({ data: article }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatArticleMutationError(error) }, { status: 400 });
  }
}

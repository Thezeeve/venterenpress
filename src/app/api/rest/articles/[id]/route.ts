import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { formatArticleMutationError, getArticleById, softDeleteArticle, updateArticle } from "@/lib/articles";
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
    "/most-read",
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({ data: article });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const browserCheck = validateBrowserMutation(request);
  if (!browserCheck.ok) {
    return NextResponse.json({ error: browserCheck.error }, { status: 403 });
  }

  const auth = await requireApiUser("articleEdit");
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

  const { id } = await params;
  const existingArticle = await getArticleById(id);
  try {
    const article = await updateArticle({
      actor: { id: auth.user.id, role: auth.user.role },
      articleId: id,
      data: parsed.data,
    });
    revalidateArticlePaths({
      slugs: [existingArticle?.slug, article.slug].filter((slug): slug is string => Boolean(slug)),
      categorySlugs: [
        ...(existingArticle?.categories.map((item) => item.category.slug) ?? []),
        ...parsed.data.categorySlugs,
      ],
      tagSlugs: [
        ...(existingArticle?.tags.map((item) => item.tag.slug) ?? []),
        ...parsed.data.tagSlugs,
      ],
    });

    return NextResponse.json({ data: article });
  } catch (error) {
    return NextResponse.json({ error: formatArticleMutationError(error) }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const browserCheck = validateBrowserMutation(request);
  if (!browserCheck.ok) {
    return NextResponse.json({ error: browserCheck.error }, { status: 403 });
  }

  const auth = await requireApiUser("articleDelete");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const existingArticle = await getArticleById(id);
  const article = await softDeleteArticle({
    actor: { id: auth.user.id, role: auth.user.role },
    articleId: id,
  });

  revalidateArticlePaths({
    slugs: [existingArticle?.slug, article.slug].filter((slug): slug is string => Boolean(slug)),
    categorySlugs: [
      ...(existingArticle?.categories.map((item) => item.category.slug) ?? []),
      ...article.categories.map((item) => item.category.slug),
    ],
    tagSlugs: [
      ...(existingArticle?.tags.map((item) => item.tag.slug) ?? []),
      ...article.tags.map((item) => item.tag.slug),
    ],
  });

  return NextResponse.json({ data: article });
}

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { formatArticleMutationError, getArticleById, softDeleteArticle, updateArticle } from "@/lib/articles";
import { validateBrowserMutation } from "@/lib/security";
import { requireApiUser } from "@/lib/server-auth";
import { articleInputSchema } from "@/lib/validation";

function revalidateArticlePaths(slug: string, categorySlugs: string[]) {
  revalidatePath("/");
  revalidatePath("/latest");
  revalidatePath(`/articles/${slug}`);

  for (const categorySlug of categorySlugs) {
    revalidatePath(`/categories/${categorySlug}`);
    revalidatePath(`/${categorySlug}`);
  }
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
  try {
    const article = await updateArticle({
      actor: { id: auth.user.id, role: auth.user.role },
      articleId: id,
      data: parsed.data,
    });
    revalidateArticlePaths(article.slug, parsed.data.categorySlugs);

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
  const article = await softDeleteArticle({
    actor: { id: auth.user.id, role: auth.user.role },
    articleId: id,
  });

  return NextResponse.json({ data: article });
}

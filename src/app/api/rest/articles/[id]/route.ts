import { NextRequest, NextResponse } from "next/server";
import { formatArticleMutationError, getArticleById, softDeleteArticle, updateArticle } from "@/lib/articles";
import { requireApiUser } from "@/lib/server-auth";
import { articleInputSchema } from "@/lib/validation";

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

    return NextResponse.json({ data: article });
  } catch (error) {
    return NextResponse.json({ error: formatArticleMutationError(error) }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

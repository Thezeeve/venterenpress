import { ArticleStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createArticle, formatArticleMutationError, listArticles } from "@/lib/articles";
import { requireApiUser } from "@/lib/server-auth";
import { articleInputSchema } from "@/lib/validation";

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

    return NextResponse.json({ data: article }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatArticleMutationError(error) }, { status: 400 });
  }
}

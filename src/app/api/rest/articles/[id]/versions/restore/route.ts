import { NextRequest, NextResponse } from "next/server";
import { restoreArticleVersion } from "@/lib/articles";
import { requireApiUser } from "@/lib/server-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser("articleEdit");
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json();
  const versionId = body?.versionId as string | undefined;

  if (!versionId) {
    return NextResponse.json({ error: "versionId is required" }, { status: 400 });
  }

  const { id } = await params;
  const article = await restoreArticleVersion({
    actor: { id: auth.user.id, role: auth.user.role },
    articleId: id,
    versionId,
  });

  return NextResponse.json({ data: article });
}

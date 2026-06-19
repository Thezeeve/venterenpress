import { NextRequest, NextResponse } from "next/server";
import { autosaveArticle } from "@/lib/articles";
import { requireApiUser } from "@/lib/server-auth";
import { articleAutosaveSchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser("articleEdit");
  if (!auth.ok) {
    return auth.response;
  }

  const payload = await request.json();
  const parsed = articleAutosaveSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid autosave payload" }, { status: 400 });
  }

  const { id } = await params;
  const autosave = await autosaveArticle({
    actor: { id: auth.user.id, role: auth.user.role },
    articleId: id,
    ...parsed.data,
  });

  return NextResponse.json({ data: autosave }, { status: 201 });
}

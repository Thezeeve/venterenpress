import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { validateBrowserMutation } from "@/lib/security";
import { workflowCommentSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const comments = await prisma.workflowComment.findMany({
    where: { articleId: id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: comments });
}

export async function POST(
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
  const parsed = workflowCommentSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment payload" }, { status: 400 });
  }

  const { id } = await params;
  const comment = await prisma.workflowComment.create({
    data: {
      articleId: id,
      userId: auth.user.id,
      body: parsed.data.body,
      visibility: parsed.data.visibility,
    },
    include: { user: true },
  });

  return NextResponse.json({ data: comment }, { status: 201 });
}

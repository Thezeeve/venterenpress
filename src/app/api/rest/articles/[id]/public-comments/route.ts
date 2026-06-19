import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { validateBrowserMutation } from "@/lib/security";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const comments = await prisma.comment.findMany({
    where: { articleId: id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 20,
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

  const auth = await requireApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json();
  if (typeof body?.body !== "string" || body.body.trim().length < 3 || body.body.trim().length > 5000) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }

  const { id } = await params;
  const comment = await prisma.comment.create({
    data: {
      articleId: id,
      userId: auth.user.id,
      body: body.body.trim(),
    },
    include: { user: true },
  });

  return NextResponse.json({ data: comment }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { validateBrowserMutation } from "@/lib/security";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const browserCheck = validateBrowserMutation(_request);
  if (!browserCheck.ok) {
    return NextResponse.json({ error: browserCheck.error }, { status: 403 });
  }

  const auth = await requireApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const existing = await prisma.bookmark.findUnique({
    where: {
      userId_articleId: {
        userId: auth.user.id,
        articleId: id,
      },
    },
  });

  if (existing) {
    await prisma.bookmark.delete({
      where: {
        userId_articleId: {
          userId: auth.user.id,
          articleId: id,
        },
      },
    });

    return NextResponse.json({ data: { bookmarked: false } });
  }

  await prisma.bookmark.create({
    data: {
      userId: auth.user.id,
      articleId: id,
    },
  });

  return NextResponse.json({ data: { bookmarked: true } });
}

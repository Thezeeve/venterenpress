import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { validateBrowserMutation } from "@/lib/security";

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

  const { id } = await params;

  if (auth.user.id === id) {
    return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_journalistId: {
        followerId: auth.user.id,
        journalistId: id,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({
      where: {
        followerId_journalistId: {
          followerId: auth.user.id,
          journalistId: id,
        },
      },
    });

    return NextResponse.json({ data: { following: false } });
  }

  await prisma.follow.create({
    data: {
      followerId: auth.user.id,
      journalistId: id,
    },
  });

  return NextResponse.json({ data: { following: true } });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { liveUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const updates = await prisma.liveUpdate.findMany({
    where: { articleId: id },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({ data: updates });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser("articleEdit");
  if (!auth.ok) {
    return auth.response;
  }

  const payload = await request.json();
  const parsed = liveUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid live update payload" }, { status: 400 });
  }

  const { id } = await params;
  const update = await prisma.liveUpdate.create({
    data: {
      articleId: id,
      title: parsed.data.title,
      body: parsed.data.body,
    },
  });

  return NextResponse.json({ data: update }, { status: 201 });
}

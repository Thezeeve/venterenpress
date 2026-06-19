import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { assignmentSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser("dashboardAccess");
  if (!auth.ok) {
    return auth.response;
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [{ assigneeId: auth.user.id }, { createdById: auth.user.id }],
    },
    include: {
      assignee: true,
      createdBy: true,
      article: true,
      comments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: assignments });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser("assignmentManage");
  if (!auth.ok) {
    return auth.response;
  }

  const payload = await request.json();
  const parsed = assignmentSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid assignment payload" }, { status: 400 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      title: parsed.data.title,
      brief: parsed.data.brief,
      articleId: parsed.data.articleId || null,
      assigneeId: parsed.data.assigneeId,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      status: parsed.data.status,
      createdById: auth.user.id,
    },
    include: {
      assignee: true,
      createdBy: true,
      article: true,
    },
  });

  return NextResponse.json({ data: assignment }, { status: 201 });
}

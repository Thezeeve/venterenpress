import { NextRequest, NextResponse } from "next/server";
import { transitionArticleWorkflow } from "@/lib/articles";
import { requireApiUser } from "@/lib/server-auth";
import { articleWorkflowActionSchema } from "@/lib/validation";

function permissionForAction(action: string) {
  switch (action) {
    case "assign_fact_checker":
    case "mark_fact_checked":
      return "articleFactCheck" as const;
    case "approve":
    case "reject":
    case "schedule":
    case "publish":
    case "archive":
      return "articleApprove" as const;
    default:
      return "articleEdit" as const;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await request.json();
  const parsed = articleWorkflowActionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid workflow action" }, { status: 400 });
  }

  const auth = await requireApiUser(permissionForAction(parsed.data.action));
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const article = await transitionArticleWorkflow({
    actor: { id: auth.user.id, role: auth.user.role },
    articleId: id,
    action: parsed.data.action,
    note: parsed.data.note,
    approverId: parsed.data.approverId,
    scheduledFor: parsed.data.scheduledFor,
  });

  return NextResponse.json({ data: article });
}

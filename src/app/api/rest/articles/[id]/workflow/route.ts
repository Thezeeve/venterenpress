import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getArticleById, transitionArticleWorkflow } from "@/lib/articles";
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

function revalidateArticleWorkflowPaths(input: {
  before: Awaited<ReturnType<typeof getArticleById>> | null;
  after: Awaited<ReturnType<typeof getArticleById>> | null;
}) {
  const paths = new Set<string>([
    "/",
    "/latest",
    "/search",
    "/topics",
    "/categories",
    "/tags",
    "/feed.xml",
    "/sitemap.xml",
  ]);

  [input.before, input.after].forEach((article) => {
    if (!article) {
      return;
    }

    paths.add(`/articles/${article.slug}`);

    article.categories.forEach((item) => {
      paths.add(`/categories/${item.category.slug}`);
      paths.add(`/topics/${item.category.slug}`);
      paths.add(`/${item.category.slug}`);
    });

    article.tags.forEach((item) => {
      paths.add(`/tags/${item.tag.slug}`);
      paths.add(`/topics/${item.tag.slug}`);
      paths.add(`/${item.tag.slug}`);
    });
  });

  paths.forEach((path) => revalidatePath(path));
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
  const existingArticle = await getArticleById(id);
  const article = await transitionArticleWorkflow({
    actor: { id: auth.user.id, role: auth.user.role },
    articleId: id,
    action: parsed.data.action,
    note: parsed.data.note,
    approverId: parsed.data.approverId,
    scheduledFor: parsed.data.scheduledFor,
  });
  revalidateArticleWorkflowPaths({
    before: existingArticle,
    after: article,
  });

  return NextResponse.json({ data: article });
}

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getArticleById, setHomepageHeroArticle } from "@/lib/articles";
import { validateBrowserMutation } from "@/lib/security";
import { requireApiUser } from "@/lib/server-auth";

function revalidateHomepageHeroPaths(article: Awaited<ReturnType<typeof getArticleById>> | null) {
  const paths = new Set<string>([
    "/",
    "/latest",
    "/most-read",
    "/search",
    "/feed.xml",
    "/sitemap.xml",
    "/topics",
    "/categories",
    "/tags",
  ]);

  if (article?.slug) {
    paths.add(`/articles/${article.slug}`);
  }

  article?.categories.forEach((item) => {
    paths.add(`/categories/${item.category.slug}`);
    paths.add(`/topics/${item.category.slug}`);
    paths.add(`/${item.category.slug}`);
  });

  article?.tags.forEach((item) => {
    paths.add(`/tags/${item.tag.slug}`);
    paths.add(`/topics/${item.tag.slug}`);
    paths.add(`/${item.tag.slug}`);
  });

  paths.forEach((path) => revalidatePath(path));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const browserCheck = validateBrowserMutation(request);
  if (!browserCheck.ok) {
    return NextResponse.json({ error: browserCheck.error }, { status: 403 });
  }

  const auth = await requireApiUser("articlePublish");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  try {
    const article = await setHomepageHeroArticle({
      actor: { id: auth.user.id, role: auth.user.role },
      articleId: id,
    });

    revalidateHomepageHeroPaths(article);
    return NextResponse.json({ data: article });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to set homepage hero." },
      { status: 400 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { validateBrowserMutation } from "@/lib/security";
import {
  generateHeadlineSuggestions,
  generateMetaDescription,
  generateSeoTitle,
  generateSocialPosts,
  grammarRecommendations,
  summarizeArticle,
  translateArticle,
} from "@/lib/ai";
import { LanguageCode } from "@prisma/client";

export async function POST(request: NextRequest) {
  const browserCheck = validateBrowserMutation(request);
  if (!browserCheck.ok) {
    return NextResponse.json({ error: browserCheck.error }, { status: 403 });
  }

  const auth = await requireApiUser("articleEdit");
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json();
  const title = typeof body?.title === "string" ? body.title : "";
  const excerpt = typeof body?.excerpt === "string" ? body.excerpt : "";
  const articleBody = typeof body?.body === "string" ? body.body : "";
  const targetLanguage = typeof body?.targetLanguage === "string" ? body.targetLanguage : "ENGLISH";

  const payload = {
    headlineSuggestions: generateHeadlineSuggestions(title),
    seoTitle: generateSeoTitle(title),
    metaDescription: generateMetaDescription(title),
    summary: summarizeArticle(articleBody || excerpt),
    socialPosts: generateSocialPosts(title),
    translation: translateArticle({
      title,
      excerpt,
      targetLanguage,
    }),
    grammarRecommendations: grammarRecommendations(articleBody || excerpt),
  };

  await prisma.aIWritingSuggestion.createMany({
    data: payload.headlineSuggestions.map((item) => ({
      userId: auth.user.id,
      suggestionType: "headline",
      title: item,
      body: item,
      language: LanguageCode.ENGLISH,
      confidence: 0.82,
    })),
  });

  return NextResponse.json({ data: payload });
}

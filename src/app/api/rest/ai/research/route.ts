import { NextRequest, NextResponse } from "next/server";
import { AIJobStatus, CredibilityLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { createResearchAssistant } from "@/lib/ai";
import { validateBrowserMutation } from "@/lib/security";

export async function GET() {
  const auth = await requireApiUser("articleEdit");
  if (!auth.ok) {
    return auth.response;
  }

  const sessions = await prisma.aIResearchSession.findMany({
    include: {
      sources: true,
      findings: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  return NextResponse.json({ data: sessions });
}

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
  const topic = typeof body?.topic === "string" ? body.topic : "";

  if (!topic.trim()) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  const result = await createResearchAssistant({ topic, prompt: body?.prompt });

  const session = await prisma.aIResearchSession.create({
    data: {
      topic,
      query: body?.prompt ?? topic,
      userId: auth.user.id,
      status: AIJobStatus.COMPLETED,
      sourceCount: result.suggestedSources.length,
      verificationScore: result.credibilityScore,
      contradictionCount: result.contradictions.length,
      notes: result.researchNotes.join("\n"),
      sources: {
        create: result.suggestedSources.map((source) => ({
          title: source.title,
          url: source.url,
          publisher: source.publisher,
          credibility: source.credibility as CredibilityLevel,
          isContradictory: source.isContradictory,
          summary: source.summary,
          score: source.score,
        })),
      },
      findings: {
        create: result.researchNotes.map((note, index) => ({
          title: `Research note ${index + 1}`,
          body: note,
          category: "research",
          importance: 10 - index,
        })),
      },
    },
    include: {
      sources: true,
      findings: true,
    },
  });

  return NextResponse.json({ data: { session, result } }, { status: 201 });
}

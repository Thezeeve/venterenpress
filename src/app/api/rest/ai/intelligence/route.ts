import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectContentIntelligence } from "@/lib/ai";
import { requireApiUser } from "@/lib/server-auth";

export async function GET() {
  const auth = await requireApiUser("articleEdit");
  if (!auth.ok) {
    return auth.response;
  }

  const intelligence = await detectContentIntelligence();

  const insights = await Promise.all(
    intelligence.trendingTopics.map((topic) =>
      prisma.aIContentInsight.create({
        data: {
          insightType: "trending-topic",
          title: topic.topic,
          description: `Trending signal count: ${topic.score}`,
          score: topic.score,
        },
      }),
    ),
  );

  return NextResponse.json({ data: { intelligence, insights } });
}

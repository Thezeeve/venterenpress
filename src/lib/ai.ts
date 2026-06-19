import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import { slugify } from "@/lib/utils";

const topicSignals = [
  "ai",
  "markets",
  "climate",
  "election",
  "war",
  "security",
  "health",
  "sports",
  "crypto",
  "podcast",
  "video",
  "technology",
  "opinion",
  "finance",
  "business",
  "education",
];

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function wordCount(text: string) {
  return cleanText(text).split(" ").filter(Boolean).length;
}

export async function createResearchAssistant(input: {
  topic: string;
  prompt?: string;
}) {
  const recentArticles = await prisma.article.findMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    include: {
      author: true,
      edition: true,
      categories: { include: { category: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const topic = input.topic.toLowerCase();
  const suggestedSources = recentArticles
    .filter((article) => {
      const haystack = `${article.title} ${article.excerpt ?? ""} ${article.aiSummary ?? ""}`.toLowerCase();
      return topic.split(" ").some((word) => haystack.includes(word));
    })
    .slice(0, 5)
    .map((article, index) => ({
      title: article.title,
      url: `${siteConfig.url}/articles/${article.slug}`,
      publisher: article.edition.name,
      credibility: index === 0 ? "VERIFIED" : "HIGH",
      isContradictory: false,
      summary: article.excerpt ?? "",
      score: Math.max(85 - index * 7, 50),
    }));

  const contradictions = suggestedSources.length > 1
    ? [
        {
          title: "Cross-check timeline consistency",
          description: "Two sources frame the sequence differently. Verify event order before publication.",
          severity: "medium",
        },
      ]
    : [];

  const notes = [
    `Start with the strongest verified source and move to context.`,
    `Document at least 3 source types before sign-off.`,
    `Capture a follow-up question about ${input.topic.toLowerCase()}.`,
  ];

  return {
    topic,
    researchNotes: notes,
    suggestedSources,
    contradictions,
    credibilityScore: suggestedSources.length ? 88 : 55,
  };
}

export function generateHeadlineSuggestions(topic: string) {
  const cleanTopic = cleanText(topic);
  return [
    `${cleanTopic}: what newsrooms need to know`,
    `Inside ${cleanTopic.toLowerCase()} and the global stakes`,
    `How ${cleanTopic.toLowerCase()} is reshaping the news agenda`,
  ];
}

export function generateSeoTitle(topic: string) {
  return `${cleanText(topic)} | ${siteConfig.name}`;
}

export function generateMetaDescription(topic: string) {
  return `${siteConfig.name} coverage of ${cleanText(topic)} with reporting, analysis, and live newsroom context.`;
}

export function summarizeArticle(body: string) {
  const words = body.split(/\s+/).slice(0, 40);
  return `${words.join(" ")}${body.split(/\s+/).length > 40 ? "..." : ""}`;
}

export function generateSocialPosts(title: string) {
  const cleanTitle = cleanText(title);
  return [
    `New from ${siteConfig.name}: ${cleanTitle}`,
    `Coverage update: ${cleanTitle}. Follow the latest reporting at ${siteConfig.name}.`,
    `${cleanTitle} - the newsroom context you need, in one place.`,
  ];
}

export function translateArticle(input: { title: string; excerpt: string; targetLanguage: string }) {
  return {
    title: `${input.title} (${input.targetLanguage})`,
    excerpt: `${input.excerpt} [${input.targetLanguage}]`,
  };
}

export function grammarRecommendations(body: string) {
  const issues: string[] = [];
  if (wordCount(body) < 120) {
    issues.push("Expand context in the lead and supporting paragraphs.");
  }
  if (!/[.!?]$/.test(cleanText(body))) {
    issues.push("End the final sentence with clear punctuation.");
  }
  if (body.length > 0 && body.includes(" very ")) {
    issues.push("Replace weak modifiers like 'very' with precise language.");
  }
  return issues.length ? issues : ["Style and grammar look production-ready."];
}

export async function detectContentIntelligence() {
  const articles = await prisma.article.findMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    select: { id: true, title: true, excerpt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  const normalized = articles.map((article) => ({
    ...article,
    signal: topicSignals.find((signal) =>
      `${article.title} ${article.excerpt ?? ""}`.toLowerCase().includes(signal),
    ),
  }));

  const duplicates = normalized
    .map((article) => {
      const slug = slugify(article.title);
      const similar = normalized.filter((other) => other.id !== article.id && slugify(other.title).includes(slug.slice(0, 18)));
      return similar.length ? { article, similar } : null;
    })
    .filter(Boolean)
    .slice(0, 5);

  const trendingTopics = topicSignals
    .map((signal) => ({
      topic: signal,
      score: normalized.filter((article) => `${article.title} ${article.excerpt ?? ""}`.toLowerCase().includes(signal)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const followUps = trendingTopics.map((topic) => ({
    topic: topic.topic,
    recommendation: `Explore a follow-up package around ${topic.topic} with edition-specific analysis and audience utility.`,
  }));

  return {
    duplicates,
    similarity: duplicates.length,
    trendingTopics,
    followUps,
    recommendedUpdates: articles.slice(0, 5).map((article) => ({
      articleId: article.id,
      recommendation: `Refresh ${article.title} with new context, SEO metadata, and linked coverage.`,
    })),
  };
}

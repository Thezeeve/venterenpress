import { ArticleStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDashboardData(userId?: string) {
  const [
    articlesInFlight,
    factCheckQueue,
    scheduledStories,
    totalReaders,
    activeSubscriptions,
    assignments,
    recentArticles,
    mediaCount,
    newsletters,
  ] = await Promise.all([
    prisma.article.count({
      where: {
        deletedAt: null,
        status: {
          in: [ArticleStatus.DRAFT, ArticleStatus.SUBMITTED, ArticleStatus.EDITOR_REVIEW],
        },
      },
    }),
    prisma.article.count({ where: { status: ArticleStatus.FACT_CHECKING, deletedAt: null } }),
    prisma.article.count({ where: { status: ArticleStatus.SCHEDULED, deletedAt: null } }),
    prisma.analyticsSnapshot.aggregate({ _sum: { views: true } }),
    prisma.subscription.count({
      where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
    }),
    prisma.assignment.findMany({
      take: 6,
      where: userId
        ? {
            OR: [{ assigneeId: userId }, { createdById: userId }],
          }
        : undefined,
      include: {
        assignee: true,
        createdBy: true,
        article: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.article.findMany({
      take: 6,
      where: userId ? { authorId: userId, deletedAt: null } : { deletedAt: null },
      include: {
        edition: true,
        categories: { include: { category: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.mediaAsset.count(),
    prisma.newsletterCampaign.count(),
  ]);

  return {
    metrics: [
      { label: "Monthly Readers", value: `${((totalReaders._sum.views ?? 0) / 1_000_000).toFixed(1)}M`, delta: "+12.4%" },
      { label: "Stories In Flight", value: `${articlesInFlight}`, delta: `${factCheckQueue} fact checks` },
      { label: "Active Subscribers", value: `${activeSubscriptions}`, delta: "+3.2%" },
      { label: "Media Assets", value: `${mediaCount}`, delta: `${newsletters} newsletters` },
    ],
    ops: {
      articlesInFlight,
      factCheckQueue,
      scheduledStories,
      activeSubscriptions,
      mediaCount,
      newsletters,
    },
    assignments,
    recentArticles,
  };
}

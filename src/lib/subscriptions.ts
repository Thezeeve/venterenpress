import { AccessTier, SubscriptionStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const FREE_LIMIT = Number(process.env.FREE_ARTICLE_LIMIT ?? 5);

export async function hasActiveSubscription(userId?: string | null) {
  if (!userId) {
    return false;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      },
    },
  });

  return Boolean(subscription);
}

export async function canAccessArticle(input: {
  articleId: string;
  accessTier: AccessTier;
  userId?: string | null;
}) {
  if (input.accessTier === AccessTier.FREE) {
    return { allowed: true, reason: "free" as const };
  }

  const subscribed = await hasActiveSubscription(input.userId);
  if (subscribed) {
    return { allowed: true, reason: "subscription" as const };
  }

  const cookieStore = await cookies();
  const meterSession = cookieStore.get("gpn-meter-session")?.value ?? "anonymous";
  const articleViews = await prisma.readerAccessEvent.count({
    where: {
      sessionId: meterSession,
      viewedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  if (articleViews >= FREE_LIMIT) {
    return { allowed: false, reason: "meter-limit" as const };
  }

  return { allowed: true, reason: "metered" as const };
}

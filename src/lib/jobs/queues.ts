import { safeQueuePush } from "@/lib/redis";

export const queueNames = {
  scheduledPublishing: "scheduled-publishing",
  newsletter: "newsletter",
  analytics: "analytics",
  media: "media-processing",
  notifications: "notifications",
  search: "search-indexing",
} as const;

type QueueName = (typeof queueNames)[keyof typeof queueNames];

type QueuedJob = {
  type: string;
  payload: Record<string, unknown>;
  runAt?: string;
};

async function enqueue(queueName: QueueName, job: QueuedJob) {
  await safeQueuePush(`gpn:queue:${queueName}`, JSON.stringify(job));
}

export async function enqueueScheduledPublish(articleId: string, scheduledFor: Date) {
  await enqueue(queueNames.scheduledPublishing, {
    type: "publish-article",
    payload: { articleId },
    runAt: scheduledFor.toISOString(),
  });
}

export async function enqueueNewsletter(campaignId: string, scheduledFor?: Date | null) {
  await enqueue(queueNames.newsletter, {
    type: "send-newsletter",
    payload: { campaignId },
    runAt: scheduledFor?.toISOString(),
  });
}

export async function enqueueSearchIndex(entityType: string, entityId: string) {
  await enqueue(queueNames.search, {
    type: "index-entity",
    payload: { entityType, entityId },
  });
}

export async function enqueueMediaProcessing(mediaId: string) {
  await enqueue(queueNames.media, {
    type: "process-media",
    payload: { mediaId },
  });
}

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { queueNames } from "@/lib/jobs/queues";
import { syncArticleSearchDocument } from "@/lib/search";
import { logger, measureAsync } from "@/lib/logger";

type WorkerJob = {
  type: string;
  payload: Record<string, unknown>;
  runAt?: string;
};

async function waitUntil(runAt?: string) {
  if (!runAt) {
    return;
  }

  const delay = new Date(runAt).getTime() - Date.now();
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

async function processJob(queueName: string, job: WorkerJob) {
  await waitUntil(job.runAt);

  if (queueName === queueNames.scheduledPublishing && job.type === "publish-article") {
    await prisma.article.update({
      where: { id: String(job.payload.articleId) },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  if (queueName === queueNames.newsletter && job.type === "send-newsletter") {
    await prisma.newsletterCampaign.update({
      where: { id: String(job.payload.campaignId) },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });
  }

  if (queueName === queueNames.search && job.type === "index-entity" && job.payload.entityType === "article") {
    await syncArticleSearchDocument(String(job.payload.entityId));
  }

  if (queueName === queueNames.media && job.type === "process-media") {
    await prisma.mediaAsset.update({
      where: { id: String(job.payload.mediaId) },
      data: {
        processingStatus: "READY",
      },
    });
  }
}

async function workQueue(queueName: string) {
  while (true) {
    const result = await redis.brpop(`gpn:queue:${queueName}`, 0);
    if (!result) {
      continue;
    }

    const [, raw] = result;
    const job = JSON.parse(raw) as WorkerJob;
    await measureAsync(`process-job:${queueName}:${job.type}`, async () => {
      await processJob(queueName, job);
    });
  }
}

async function main() {
  await Promise.all(Object.values(queueNames).map((queueName) => workQueue(queueName)));
}

main().catch((error) => {
  logger.error("Worker failed", { error: String(error) });
  process.exit(1);
});

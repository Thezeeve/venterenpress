import {
  ArticleStatus,
  Prisma,
  Role,
  WorkflowDecision,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import { enqueueScheduledPublish, enqueueSearchIndex } from "@/lib/jobs/queues";

const articleInclude = {
  author: true,
  edition: true,
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  workflowSteps: { orderBy: { createdAt: "desc" as const } },
  workflowComments: { include: { user: true }, orderBy: { createdAt: "desc" as const } },
  assignments: { include: { assignee: true, createdBy: true }, orderBy: { createdAt: "desc" as const } },
  versions: { include: { author: true }, orderBy: { version: "desc" as const } },
  media: { orderBy: { createdAt: "desc" as const } },
  liveUpdates: { orderBy: { publishedAt: "desc" as const } },
} satisfies Prisma.ArticleInclude;

function buildPublicationTimestamps(status: ArticleStatus, existing?: {
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  publishedAt?: Date | null;
}) {
  const now = new Date();
  return {
    submittedAt:
      status !== ArticleStatus.DRAFT ? existing?.submittedAt ?? now : existing?.submittedAt ?? null,
    approvedAt:
      status === ArticleStatus.PUBLISHED || status === ArticleStatus.APPROVED
        ? existing?.approvedAt ?? now
        : existing?.approvedAt ?? null,
    publishedAt:
      status === ArticleStatus.PUBLISHED
        ? existing?.publishedAt ?? now
        : existing?.publishedAt ?? null,
  };
}

export async function listArticles(filters?: {
  authorId?: string;
  statuses?: ArticleStatus[];
  q?: string;
}) {
  return prisma.article.findMany({
    where: {
      deletedAt: null,
      ...(filters?.authorId ? { authorId: filters.authorId } : {}),
      ...(filters?.statuses?.length ? { status: { in: filters.statuses } } : {}),
      ...(filters?.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { excerpt: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      author: true,
      edition: true,
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getArticleById(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: articleInclude,
  });
}

async function connectTags(tagSlugs: string[]) {
  const unique = [...new Set(tagSlugs.map((tag) => slugify(tag)))];
  const tags = await Promise.all(
    unique.map((slug) =>
      prisma.tag.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          name: slug
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" "),
        },
      }),
    ),
  );

  return tags;
}

export async function createArticle(input: {
  actor: { id: string; role: Role };
  data: {
    title: string;
    slug?: string;
    dek?: string | null;
    excerpt: string;
    premiumPreview?: string | null;
    body: Prisma.InputJsonValue;
    status: ArticleStatus;
    accessTier: "FREE" | "PREMIUM" | "MEMBERS_ONLY";
    articleType:
      | "NEWS"
      | "ANALYSIS"
      | "OPINION"
      | "EDITORIAL"
      | "LIVE_BLOG"
      | "VIDEO"
      | "PODCAST"
      | "INVESTIGATION"
      | "SPONSORED";
    editionCode: string;
    categorySlugs: string[];
    tagSlugs: string[];
    seoTitle?: string | null;
    seoDescription?: string | null;
    featured?: boolean;
    breaking?: boolean;
    scheduledFor?: string | null;
    featuredImageUrl?: string | null;
    featuredImageAlt?: string | null;
    videoUrl?: string | null;
    audioUrl?: string | null;
  };
}) {
  const edition = await prisma.edition.findUnique({
    where: { code: input.data.editionCode as never },
  });

  if (!edition) {
    throw new Error("Edition not found");
  }

  const categories = await prisma.category.findMany({
    where: { slug: { in: input.data.categorySlugs } },
  });

  const tags = await connectTags(input.data.tagSlugs);
  const publicationTimestamps = buildPublicationTimestamps(input.data.status);

  const article = await prisma.article.create({
    data: {
      slug: input.data.slug || slugify(input.data.title),
      title: input.data.title,
      dek: input.data.dek || null,
      excerpt: input.data.excerpt,
      premiumPreview: input.data.premiumPreview || null,
      body: input.data.body,
      status: input.data.status,
      accessTier: input.data.accessTier,
      articleType: input.data.articleType,
      seoTitle: input.data.seoTitle || null,
      seoDescription: input.data.seoDescription || null,
      featured: input.data.featured ?? false,
      breaking: input.data.breaking ?? false,
      scheduledFor: input.data.scheduledFor ? new Date(input.data.scheduledFor) : null,
      submittedAt: publicationTimestamps.submittedAt,
      approvedAt: publicationTimestamps.approvedAt,
      publishedAt: publicationTimestamps.publishedAt,
      featuredImageUrl: input.data.featuredImageUrl || null,
      featuredImageAlt: input.data.featuredImageAlt || null,
      videoUrl: input.data.videoUrl || null,
      audioUrl: input.data.audioUrl || null,
      authorId: input.actor.id,
      editionId: edition.id,
      categories: {
        create: categories.map((category) => ({ categoryId: category.id })),
      },
      tags: {
        create: tags.map((tag) => ({ tagId: tag.id })),
      },
      versions: {
        create: {
          authorId: input.actor.id,
          version: 1,
          title: input.data.title,
          excerpt: input.data.excerpt,
          body: input.data.body,
          status: input.data.status,
          changelog: "Initial draft",
        },
      },
    },
    include: articleInclude,
  });

  if (article.status === ArticleStatus.SCHEDULED && article.scheduledFor) {
    await enqueueScheduledPublish(article.id, article.scheduledFor);
  }

  await enqueueSearchIndex("article", article.id);
  await writeAuditLog({
    userId: input.actor.id,
    action: "article.create",
    resource: article.id,
    metadata: { status: article.status },
  });

  return article;
}

export async function updateArticle(input: {
  actor: { id: string; role: Role };
  articleId: string;
  data: Parameters<typeof createArticle>[0]["data"];
}) {
  const article = await prisma.article.findUnique({
    where: { id: input.articleId },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });

  if (!article) {
    throw new Error("Article not found");
  }

  const edition = await prisma.edition.findUnique({
    where: { code: input.data.editionCode as never },
  });

  if (!edition) {
    throw new Error("Edition not found");
  }

  const categories = await prisma.category.findMany({
    where: { slug: { in: input.data.categorySlugs } },
  });
  const tags = await connectTags(input.data.tagSlugs);
  const publicationTimestamps = buildPublicationTimestamps(input.data.status, article);

  const updated = await prisma.article.update({
    where: { id: input.articleId },
    data: {
      slug: input.data.slug || slugify(input.data.title),
      title: input.data.title,
      dek: input.data.dek || null,
      excerpt: input.data.excerpt,
      premiumPreview: input.data.premiumPreview || null,
      body: input.data.body,
      status: input.data.status,
      accessTier: input.data.accessTier,
      articleType: input.data.articleType,
      seoTitle: input.data.seoTitle || null,
      seoDescription: input.data.seoDescription || null,
      featured: input.data.featured ?? false,
      breaking: input.data.breaking ?? false,
      scheduledFor: input.data.scheduledFor ? new Date(input.data.scheduledFor) : null,
      submittedAt: publicationTimestamps.submittedAt,
      approvedAt: publicationTimestamps.approvedAt,
      publishedAt: publicationTimestamps.publishedAt,
      featuredImageUrl: input.data.featuredImageUrl || null,
      featuredImageAlt: input.data.featuredImageAlt || null,
      videoUrl: input.data.videoUrl || null,
      audioUrl: input.data.audioUrl || null,
      editionId: edition.id,
      categories: {
        deleteMany: {},
        create: categories.map((category) => ({ categoryId: category.id })),
      },
      tags: {
        deleteMany: {},
        create: tags.map((tag) => ({ tagId: tag.id })),
      },
      versions: {
        create: {
          authorId: input.actor.id,
          version: (article.versions[0]?.version ?? 0) + 1,
          title: input.data.title,
          excerpt: input.data.excerpt,
          body: input.data.body,
          status: input.data.status,
          changelog: "Editorial update",
        },
      },
    },
    include: articleInclude,
  });
  console.info("Updated article featured image", {
    articleId: updated.id,
    slug: updated.slug,
    featuredImageUrl: updated.featuredImageUrl,
  });

  if (updated.status === ArticleStatus.SCHEDULED && updated.scheduledFor) {
    await enqueueScheduledPublish(updated.id, updated.scheduledFor);
  }

  await enqueueSearchIndex("article", updated.id);
  await writeAuditLog({
    userId: input.actor.id,
    action: "article.update",
    resource: updated.id,
    metadata: { status: updated.status },
  });

  return updated;
}

export function formatArticleMutationError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "An article with this slug already exists.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to save article.";
}

export async function autosaveArticle(input: {
  actor: { id: string; role: Role };
  articleId: string;
  title: string;
  excerpt?: string;
  body: Prisma.InputJsonValue;
}) {
  const article = await prisma.article.findUnique({ where: { id: input.articleId } });

  if (!article) {
    throw new Error("Article not found");
  }

  const autosave = await prisma.articleAutosave.create({
    data: {
      articleId: input.articleId,
      userId: input.actor.id,
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
    },
  });

  await writeAuditLog({
    userId: input.actor.id,
    action: "article.autosave",
    resource: input.articleId,
  });

  return autosave;
}

export async function restoreArticleVersion(input: {
  actor: { id: string; role: Role };
  articleId: string;
  versionId: string;
}) {
  const version = await prisma.articleVersion.findUnique({
    where: { id: input.versionId },
  });

  if (!version || version.articleId !== input.articleId) {
    throw new Error("Version not found");
  }

  const latest = await prisma.articleVersion.findFirst({
    where: { articleId: input.articleId },
    orderBy: { version: "desc" },
  });

  const article = await prisma.article.update({
    where: { id: input.articleId },
    data: {
      title: version.title,
      excerpt: version.excerpt,
      body: version.body as Prisma.InputJsonValue,
      status: ArticleStatus.DRAFT,
      versions: {
        create: {
          authorId: input.actor.id,
          version: (latest?.version ?? 0) + 1,
          title: version.title,
          excerpt: version.excerpt,
          body: version.body as Prisma.InputJsonValue,
          status: ArticleStatus.DRAFT,
          changelog: `Restored from version ${version.version}`,
        },
      },
    },
    include: articleInclude,
  });

  await writeAuditLog({
    userId: input.actor.id,
    action: "article.restoreVersion",
    resource: input.articleId,
    metadata: { versionId: input.versionId },
  });

  return article;
}

export async function transitionArticleWorkflow(input: {
  actor: { id: string; role: Role };
  articleId: string;
  action:
    | "submit"
    | "request_changes"
    | "assign_fact_checker"
    | "mark_fact_checked"
    | "approve"
    | "reject"
    | "schedule"
    | "publish"
    | "archive";
  note?: string;
  approverId?: string;
  scheduledFor?: string;
}) {
  const article = await prisma.article.findUnique({ where: { id: input.articleId } });

  if (!article) {
    throw new Error("Article not found");
  }

  const data: Prisma.ArticleUpdateInput = {};
  let roleForStep = input.actor.role;
  let decision: WorkflowDecision = WorkflowDecision.PENDING;

  switch (input.action) {
    case "submit":
      data.status = ArticleStatus.SUBMITTED;
      data.submittedAt = new Date();
      break;
    case "request_changes":
      data.status = ArticleStatus.DRAFT;
      decision = WorkflowDecision.CHANGES_REQUESTED;
      break;
    case "assign_fact_checker":
      data.status = ArticleStatus.FACT_CHECKING;
      roleForStep = Role.FACT_CHECKER;
      break;
    case "mark_fact_checked":
      data.status = ArticleStatus.EDITOR_REVIEW;
      decision = WorkflowDecision.APPROVED;
      roleForStep = Role.FACT_CHECKER;
      break;
    case "approve":
      data.status = ArticleStatus.APPROVED;
      data.approvedAt = new Date();
      decision = WorkflowDecision.APPROVED;
      break;
    case "reject":
      data.status = ArticleStatus.DRAFT;
      decision = WorkflowDecision.REJECTED;
      break;
    case "schedule":
      data.status = ArticleStatus.SCHEDULED;
      data.scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : null;
      decision = WorkflowDecision.APPROVED;
      break;
    case "publish":
      data.status = ArticleStatus.PUBLISHED;
      data.publishedAt = new Date();
      decision = WorkflowDecision.APPROVED;
      break;
    case "archive":
      data.status = ArticleStatus.ARCHIVED;
      data.archivedAt = new Date();
      decision = WorkflowDecision.APPROVED;
      break;
  }

  const updated = await prisma.article.update({
    where: { id: input.articleId },
    data: {
      ...data,
      workflowSteps: {
        create: {
          role: roleForStep,
          approverId: input.approverId ?? input.actor.id,
          decision,
          notes: input.note,
          completedAt: new Date(),
        },
      },
      workflowComments: input.note
        ? {
            create: {
              userId: input.actor.id,
              body: input.note,
              visibility: "INTERNAL",
            },
          }
        : undefined,
    },
    include: articleInclude,
  });

  if (updated.status === ArticleStatus.SCHEDULED && updated.scheduledFor) {
    await enqueueScheduledPublish(updated.id, updated.scheduledFor);
  }

  await enqueueSearchIndex("article", updated.id);
  await writeAuditLog({
    userId: input.actor.id,
    action: `article.workflow.${input.action}`,
    resource: updated.id,
    metadata: { status: updated.status },
  });

  return updated;
}

export async function softDeleteArticle(input: {
  actor: { id: string; role: Role };
  articleId: string;
}) {
  const article = await prisma.article.update({
    where: { id: input.articleId },
    data: {
      deletedAt: new Date(),
      status: ArticleStatus.ARCHIVED,
    },
  });

  await writeAuditLog({
    userId: input.actor.id,
    action: "article.delete",
    resource: input.articleId,
  });

  return article;
}

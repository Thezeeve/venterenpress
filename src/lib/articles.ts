import {
  ArticleStatus,
  Prisma,
  Role,
  WorkflowDecision,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HOMEPAGE_HERO_ARTICLE_KEY, HOMEPAGE_HERO_MAX_ITEMS, isHeroWindowActive } from "@/lib/homepage-hero";
import { normalizeSlug, slugify } from "@/lib/utils";
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

type ArticleMutationInput = {
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
  showOnHero?: boolean;
  heroStartAt?: string | null;
  heroEndAt?: string | null;
  heroPriority?: number | null;
};

function parseOptionalDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function getCanonicalArticleSlug(input: Pick<ArticleMutationInput, "slug" | "title">) {
  return normalizeSlug(input.slug?.trim() || input.title);
}

async function generateUniqueArticleSlug(input: {
  slug?: string;
  title: string;
  excludeArticleId?: string;
}) {
  const baseSlug = getCanonicalArticleSlug(input);

  if (!baseSlug) {
    throw new Error("Unable to generate article slug.");
  }

  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    const existing = await prisma.article.findFirst({
      where: {
        slug: candidate,
        ...(input.excludeArticleId ? { id: { not: input.excludeArticleId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique article slug.");
}

export function normalizeArticleRouteSlug(slug: string) {
  return normalizeSlug(decodeURIComponent(slug ?? ""));
}

export function getArticleSlugCandidates(slug: string) {
  const exactSlug = String(slug ?? "").trim();
  const normalizedSlug = normalizeArticleRouteSlug(exactSlug);
  return [...new Set([exactSlug, normalizedSlug].filter(Boolean))];
}

function createHeroPriorityOrderClause() {
  return [
    { heroPriority: "asc" as const },
    { heroStartAt: "asc" as const },
    { publishedAt: "asc" as const },
    { createdAt: "asc" as const },
  ];
}

function isArticleCurrentlyActiveHero(article: {
  articleStatus: ArticleStatus;
  deletedAt?: Date | null;
  showOnHero?: boolean | null;
  heroStartAt?: Date | null;
  heroEndAt?: Date | null;
}) {
  return article.articleStatus === ArticleStatus.PUBLISHED
    && !article.deletedAt
    && isHeroWindowActive(article);
}

export async function enforceHeroCapacity(input: {
  articleId?: string;
  articleStatus: ArticleStatus;
  deletedAt?: Date | null;
  showOnHero?: boolean | null;
  heroStartAt?: Date | null;
  heroEndAt?: Date | null;
}) {
  if (!isArticleCurrentlyActiveHero(input)) {
    return;
  }

  const activeHeroes = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      deletedAt: null,
      showOnHero: true,
    },
    select: {
      id: true,
      heroStartAt: true,
      heroEndAt: true,
      heroPriority: true,
      publishedAt: true,
      createdAt: true,
      showOnHero: true,
    },
    orderBy: createHeroPriorityOrderClause(),
  });

  const activeNow = activeHeroes.filter((article) => isHeroWindowActive(article));
  if (activeNow.length <= HOMEPAGE_HERO_MAX_ITEMS) {
    return;
  }

  const removable = activeNow.filter((article) => article.id !== input.articleId);
  const overflow = activeNow.length - HOMEPAGE_HERO_MAX_ITEMS;
  const articlesToDisable = removable.slice(0, overflow);

  if (!articlesToDisable.length) {
    return;
  }

  await prisma.article.updateMany({
    where: { id: { in: articlesToDisable.map((article) => article.id) } },
    data: { showOnHero: false },
  });
}

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

export async function getArticleBySlug<TInclude extends Prisma.ArticleInclude | undefined>(
  slug: string,
  include?: TInclude,
) {
  for (const candidate of getArticleSlugCandidates(slug)) {
    const article = await prisma.article.findUnique({
      where: { slug: candidate },
      ...(include ? { include } : {}),
    });

    if (article) {
      return article;
    }
  }

  return null;
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

async function clearHomepageHeroIfMatches(articleId: string) {
  const currentHeroArticleId = await getHomepageHeroArticleId();
  if (currentHeroArticleId !== articleId) {
    return;
  }

  await prisma.siteSetting.upsert({
    where: { key: HOMEPAGE_HERO_ARTICLE_KEY },
    update: { value: { articleId: null } },
    create: { key: HOMEPAGE_HERO_ARTICLE_KEY, value: { articleId: null } },
  });
}

export async function createArticle(input: {
  actor: { id: string; role: Role };
  data: ArticleMutationInput;
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
  const slug = await generateUniqueArticleSlug({
    slug: input.data.slug,
    title: input.data.title,
  });

  const article = await prisma.article.create({
    data: {
      slug,
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
      showOnHero: input.data.showOnHero ?? false,
      heroStartAt: parseOptionalDate(input.data.heroStartAt),
      heroEndAt: parseOptionalDate(input.data.heroEndAt),
      heroPriority: input.data.heroPriority ?? null,
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

  await enforceHeroCapacity({
    articleId: article.id,
    articleStatus: article.status,
    deletedAt: article.deletedAt,
    showOnHero: article.showOnHero,
    heroStartAt: article.heroStartAt,
    heroEndAt: article.heroEndAt,
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
  data: ArticleMutationInput;
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
  const slug = await generateUniqueArticleSlug({
    slug: input.data.slug,
    title: input.data.title,
    excludeArticleId: input.articleId,
  });

  const updated = await prisma.article.update({
    where: { id: input.articleId },
    data: {
      slug,
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
      showOnHero: input.data.showOnHero ?? false,
      heroStartAt: parseOptionalDate(input.data.heroStartAt),
      heroEndAt: parseOptionalDate(input.data.heroEndAt),
      heroPriority: input.data.heroPriority ?? null,
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

  if (updated.status !== ArticleStatus.PUBLISHED || updated.deletedAt) {
    await clearHomepageHeroIfMatches(updated.id);
  }

  await enforceHeroCapacity({
    articleId: updated.id,
    articleStatus: updated.status,
    deletedAt: updated.deletedAt,
    showOnHero: updated.showOnHero,
    heroStartAt: updated.heroStartAt,
    heroEndAt: updated.heroEndAt,
  });

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

  if (updated.status !== ArticleStatus.PUBLISHED || updated.deletedAt) {
    await clearHomepageHeroIfMatches(updated.id);
  }

  await enforceHeroCapacity({
    articleId: updated.id,
    articleStatus: updated.status,
    deletedAt: updated.deletedAt,
    showOnHero: updated.showOnHero,
    heroStartAt: updated.heroStartAt,
    heroEndAt: updated.heroEndAt,
  });

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
    include: {
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });

  await prisma.searchDocument.deleteMany({
    where: {
      entityType: "article",
      entityId: input.articleId,
    },
  }).catch(() => null);

  await clearHomepageHeroIfMatches(input.articleId);

  await writeAuditLog({
    userId: input.actor.id,
    action: "article.delete",
    resource: input.articleId,
  });

  return article;
}

export async function getHomepageHeroArticleId() {
  const articles = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      deletedAt: null,
      showOnHero: true,
    },
    orderBy: [{ heroPriority: "desc" }, { heroStartAt: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
    take: HOMEPAGE_HERO_MAX_ITEMS * 2,
  });

  return articles.find((article) => isHeroWindowActive(article))?.id ?? null;
}

export async function setHomepageHeroArticle(input: {
  actor: { id: string; role: Role };
  articleId: string;
}) {
  const article = await prisma.article.findUnique({
    where: { id: input.articleId },
    include: articleInclude,
  });

  if (!article) {
    throw new Error("Article not found");
  }

  if (article.deletedAt || article.status !== ArticleStatus.PUBLISHED) {
    throw new Error("Only published, non-deleted articles can be set as the homepage hero.");
  }

  const topPriorityHero = await prisma.article.findFirst({
    where: {
      status: ArticleStatus.PUBLISHED,
      deletedAt: null,
      showOnHero: true,
      id: { not: article.id },
    },
    orderBy: [{ heroPriority: "desc" }],
    select: { heroPriority: true },
  });

  const updated = await prisma.article.update({
    where: { id: article.id },
    data: {
      showOnHero: true,
      heroStartAt: article.heroStartAt ?? article.publishedAt ?? new Date(),
      heroPriority: (topPriorityHero?.heroPriority ?? 0) + 1,
    },
    include: articleInclude,
  });

  await prisma.siteSetting.upsert({
    where: { key: HOMEPAGE_HERO_ARTICLE_KEY },
    update: { value: { articleId: article.id } },
    create: { key: HOMEPAGE_HERO_ARTICLE_KEY, value: { articleId: article.id } },
  });

  await enforceHeroCapacity({
    articleId: updated.id,
    articleStatus: updated.status,
    deletedAt: updated.deletedAt,
    showOnHero: updated.showOnHero,
    heroStartAt: updated.heroStartAt,
    heroEndAt: updated.heroEndAt,
  });

  await writeAuditLog({
    userId: input.actor.id,
    action: "article.setHomepageHero",
    resource: article.id,
  });

  return updated;
}

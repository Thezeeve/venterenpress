import { z } from "zod";
import { normalizeSlug } from "@/lib/utils";

function emptyStringToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function nullableTrimmedString(max: number, options?: { min?: number; field: string }) {
  let schema = z.string().trim();

  if (typeof options?.min === "number") {
    schema = schema.min(options.min, `${options.field} must be at least ${options.min} characters.`);
  }

  return z.preprocess(
    emptyStringToNull,
    schema.max(max, `${options?.field ?? "Field"} must be ${max} characters or fewer.`).nullable().optional(),
  );
}

function nullableIsoDatetime(field: string) {
  return z.preprocess(
    emptyStringToNull,
    z.string().datetime({ message: `${field} is invalid.` }).nullable().optional(),
  );
}

function nullableUrl(field: string) {
  return z.preprocess(
    emptyStringToNull,
    z.string().url(`${field} must be a valid URL.`).nullable().optional(),
  );
}

const otpSchema = z
  .union([z.string().trim().length(6), z.literal("")])
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  });

export const articleStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "FACT_CHECKING",
  "EDITOR_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
]);

export const articleInputSchema = z.object({
  title: z.string().trim().min(10, "Title must be at least 10 characters.").max(180, "Title must be 180 characters or fewer."),
  slug: z.string().trim().min(3, "Slug must be at least 3 characters.").max(200, "Slug must be 200 characters or fewer.").transform((value) => normalizeSlug(value)),
  dek: nullableTrimmedString(220, { field: "Dek" }),
  excerpt: z.string().trim().min(20, "Excerpt must be at least 20 characters.").max(420, "Excerpt must be 420 characters or fewer."),
  premiumPreview: z.string().max(500).optional(),
  body: z.any(),
  status: articleStatusSchema.default("DRAFT"),
  accessTier: z.enum(["FREE", "PREMIUM", "MEMBERS_ONLY"]).default("FREE"),
  articleType: z
    .enum([
      "NEWS",
      "ANALYSIS",
      "OPINION",
      "EDITORIAL",
      "LIVE_BLOG",
      "VIDEO",
      "PODCAST",
      "INVESTIGATION",
      "SPONSORED",
    ])
    .default("NEWS"),
  editionCode: z.string().trim().min(2, "Region is required."),
  categorySlugs: z.array(z.string().trim().min(1)).min(1, "Choose at least one category."),
  tagSlugs: z.array(z.string().trim().min(1)).default([]),
  seoTitle: nullableTrimmedString(70, { field: "SEO Title" }),
  seoDescription: nullableTrimmedString(160, { field: "SEO Description" }),
  featured: z.boolean().default(false),
  breaking: z.boolean().default(false),
  scheduledFor: nullableIsoDatetime("Scheduled publish date"),
  featuredImageUrl: nullableUrl("Featured image URL"),
  featuredImageAlt: nullableTrimmedString(200, { field: "Featured image alt text" }),
  videoUrl: nullableUrl("Video URL"),
  audioUrl: nullableUrl("Audio URL"),
  showOnHero: z.boolean().default(false),
  heroStartAt: nullableIsoDatetime("Hero Start date"),
  heroEndAt: nullableIsoDatetime("Hero End date"),
  heroPriority: z.number().int("Hero Priority must be a whole number.").min(0, "Hero Priority cannot be negative.").optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.heroStartAt && value.heroEndAt) {
    const startAt = new Date(value.heroStartAt);
    const endAt = new Date(value.heroEndAt);
    if (startAt.getTime() > endAt.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["heroEndAt"],
        message: "Hero End date must be after Hero Start date.",
      });
    }
  }
});

export const articleWorkflowActionSchema = z.object({
  action: z.enum([
    "submit",
    "request_changes",
    "assign_fact_checker",
    "mark_fact_checked",
    "approve",
    "reject",
    "schedule",
    "publish",
    "archive",
  ]),
  note: z.string().max(2000).optional(),
  approverId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

export const articleAutosaveSchema = z.object({
  title: z.string().min(1).max(180),
  excerpt: z.string().max(420).optional(),
  body: z.any(),
});

export const workflowCommentSchema = z.object({
  body: z.string().min(3).max(2000),
  visibility: z.enum(["INTERNAL", "FACT_CHECK_ONLY", "EDITORIAL"]).default("INTERNAL"),
});

export const assignmentSchema = z.object({
  title: z.string().min(6).max(160),
  brief: z.string().min(20).max(3000),
  assigneeId: z.string().min(1),
  articleId: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  status: z
    .enum(["PITCHED", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED"])
    .default("ASSIGNED"),
});

export const mediaUploadRequestSchema = z.object({
  fileName: z.string().min(3).max(180),
  contentType: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
  type: z.enum([
    "IMAGE",
    "VIDEO",
    "AUDIO",
    "GALLERY",
    "LIVE_STREAM",
    "GRAPHIC",
    "AUTHOR_PHOTO",
    "PODCAST_COVER",
  ]),
  title: z.string().min(2).max(140),
  altText: z.string().max(200).optional(),
  articleId: z.string().optional().nullable(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  durationSec: z.number().int().optional(),
});

export const newsletterSignupSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  topics: z.array(z.string().max(60)).max(10).default([]),
  regions: z.array(z.string().max(60)).max(10).default([]),
});

export const newsletterCampaignSchema = z.object({
  title: z.string().min(6).max(160),
  subject: z.string().min(6).max(140),
  preheader: z.string().max(180).optional(),
  bodyHtml: z.string().min(20),
  articleId: z.string().optional().nullable(),
  segmentId: z.string().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
});

export const breakingBannerSchema = z.object({
  title: z.string().min(6).max(160),
  summary: z.string().max(220).optional(),
  linkUrl: z.string().url().optional(),
  editionId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(10),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional().nullable(),
});

export const liveUpdateSchema = z.object({
  title: z.string().min(3).max(160),
  body: z.string().min(10).max(5000),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otp: otpSchema,
});

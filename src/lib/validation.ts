import { z } from "zod";

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
  title: z.string().min(10).max(180),
  slug: z.string().min(3).max(200),
  dek: z.string().max(220).optional().or(z.literal("")),
  excerpt: z.string().min(20).max(420),
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
  editionCode: z.string().min(2),
  categorySlugs: z.array(z.string()).min(1),
  tagSlugs: z.array(z.string()).default([]),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  featured: z.boolean().default(false),
  breaking: z.boolean().default(false),
  scheduledFor: z.string().datetime().optional().nullable(),
  featuredImageUrl: z.string().url().optional().or(z.literal("")),
  featuredImageAlt: z.string().max(200).optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  audioUrl: z.string().url().optional().or(z.literal("")),
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

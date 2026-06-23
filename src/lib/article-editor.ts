import { normalizeSlug, slugify } from "@/lib/utils";

export type EditorFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  categories: string;
  tags: string;
  editionCode: string;
  seoTitle: string;
  seoDescription: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
  showOnHero: boolean;
  heroStartAt: string;
  heroEndAt: string;
  heroPriority: string;
};

export type EditorSubmitIntent = "draft" | "publish";

export const ARTICLE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const ARTICLE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'");
}

function stripHtml(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function parseArticleBodyWithoutDom(html: string) {
  const sanitized = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const blocks = [...sanitized.matchAll(/<(h2|h3|blockquote|ul|ol|p)[^>]*>([\s\S]*?)<\/\1>/gi)];

  const content = blocks
    .map(([, tagName, innerHtml]) => {
      const tag = tagName.toUpperCase();

      if (tag === "UL" || tag === "OL") {
        const items = [...innerHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
          .map((match) => stripHtml(match[1] ?? ""))
          .filter(Boolean);
        return items.length ? { type: "bulletList", items } : null;
      }

      const text = stripHtml(innerHtml);
      if (!text) {
        return null;
      }

      if (tag === "H2") {
        return { type: "heading", level: 2, text };
      }

      if (tag === "H3") {
        return { type: "heading", level: 3, text };
      }

      if (tag === "BLOCKQUOTE") {
        return { type: "blockquote", text };
      }

      return { type: "paragraph", text };
    })
    .filter((node): node is NonNullable<typeof node> => Boolean(node));

  if (content.length > 0) {
    return {
      type: "doc",
      content,
    };
  }

  const text = stripHtml(sanitized);
  return {
    type: "doc",
    content: [{ type: "paragraph", text }],
  };
}

export function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateArticleImageFile(file: File) {
  const fileName = file.name.toLowerCase();
  const extension = fileName.split(".").pop() ?? "";
  const hasAllowedExtension = ["jpg", "jpeg", "png", "webp"].includes(extension);
  const hasAllowedMimeType = SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase());

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    return "Upload JPG, PNG, or WEBP files only.";
  }

  if (file.size > ARTICLE_IMAGE_MAX_BYTES) {
    return "Image must be 10MB or smaller.";
  }

  return null;
}

export function articleBodyToEditorHtml(body: unknown) {
  if (!body || typeof body !== "object") {
    return body ? `<p>${String(body)}</p>` : "<p></p>";
  }

  const maybeDoc = body as { content?: Array<Record<string, unknown>> };
  if (!Array.isArray(maybeDoc.content)) {
    return "<p></p>";
  }

  return maybeDoc.content
    .map((node) => {
      const text = typeof node.text === "string" ? node.text : "";
      if (node.type === "heading") {
        const level = node.level === 3 ? "h3" : "h2";
        return `<${level}>${text}</${level}>`;
      }

      if (node.type === "blockquote") {
        return `<blockquote><p>${text}</p></blockquote>`;
      }

      if (node.type === "bulletList" && Array.isArray(node.items)) {
        const items = node.items.map((item) => `<li>${String(item)}</li>`).join("");
        return `<ul>${items}</ul>`;
      }

      return `<p>${text}</p>`;
    })
    .join("");
}

export function htmlToArticleBody(html: string) {
  if (typeof DOMParser === "undefined") {
    return parseArticleBodyWithoutDom(html);
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  document.querySelectorAll("script,style").forEach((node) => node.remove());

  const content = [...document.body.childNodes]
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        return text ? { type: "paragraph", text } : null;
      }

      if (!(node instanceof HTMLElement)) {
        return null;
      }

      const text = node.textContent?.trim() ?? "";
      if (!text && !["UL", "OL"].includes(node.tagName)) {
        return null;
      }

      switch (node.tagName) {
        case "H2":
          return { type: "heading", level: 2, text };
        case "H3":
          return { type: "heading", level: 3, text };
        case "BLOCKQUOTE":
          return { type: "blockquote", text };
        case "UL":
        case "OL": {
          const items = [...node.querySelectorAll("li")]
            .map((item) => item.textContent?.trim() ?? "")
            .filter(Boolean);
          return items.length ? { type: "bulletList", items } : null;
        }
        default:
          return { type: "paragraph", text };
      }
    })
    .filter((node): node is NonNullable<typeof node> => Boolean(node));

  return {
    type: "doc",
    content: content.length ? content : [{ type: "paragraph", text: "" }],
  };
}

export function validateEditorValues(values: EditorFormValues, bodyHtml: string) {
  const issues = validateEditorIssues(values, bodyHtml);
  return issues[0] ?? null;
}

export function validateEditorIssues(values: EditorFormValues, bodyHtml: string) {
  const issues: string[] = [];

  if (!values.title.trim()) {
    issues.push("Title required.");
  } else if (values.title.trim().length < 10) {
    issues.push("Title must be at least 10 characters.");
  }

  if (!values.slug.trim()) {
    issues.push("Slug required.");
  } else if (values.slug.trim().length < 3) {
    issues.push("Slug must be at least 3 characters.");
  }

  if (!values.excerpt.trim()) {
    issues.push("Summary required.");
  } else if (values.excerpt.trim().length < 20) {
    issues.push("Excerpt must be at least 20 characters.");
  }

  if (!splitCommaSeparated(values.categories).length) {
    issues.push("Category required.");
  }

  if (!bodyHtml.replace(/<[^>]+>/g, "").trim()) {
    issues.push("Body required.");
  }

  return issues;
}

export function buildArticlePayload(values: EditorFormValues, bodyHtml: string, intent: EditorSubmitIntent) {
  const normalizedSlug = normalizeSlug(values.slug.trim() || values.title);

  return {
    title: values.title.trim(),
    slug: normalizedSlug || slugify(values.title),
    dek: "",
    excerpt: values.excerpt.trim(),
    body: htmlToArticleBody(bodyHtml),
    status: intent === "publish" ? "PUBLISHED" : "DRAFT",
    accessTier: "FREE",
    articleType: "NEWS",
    editionCode: values.editionCode,
    categorySlugs: splitCommaSeparated(values.categories),
    tagSlugs: splitCommaSeparated(values.tags),
    seoTitle: values.seoTitle.trim(),
    seoDescription: values.seoDescription.trim(),
    featured: false,
    breaking: false,
    scheduledFor: null,
    featuredImageUrl: values.featuredImageUrl.trim(),
    featuredImageAlt: values.featuredImageAlt.trim(),
    videoUrl: "",
    audioUrl: "",
    showOnHero: values.showOnHero,
    heroStartAt: values.heroStartAt.trim() || null,
    heroEndAt: values.heroEndAt.trim() || null,
    heroPriority: values.heroPriority.trim() ? Number.parseInt(values.heroPriority.trim(), 10) : null,
  };
}

export function extractApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  return fallback;
}

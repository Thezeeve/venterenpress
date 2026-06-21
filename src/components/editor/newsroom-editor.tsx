"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, Globe2, ImagePlus, Laptop, LoaderCircle, Quote, Save, SendHorizontal, Smartphone, Trash2 } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { ArticleBody } from "@/components/article/article-body";
import { HomepageHeroButton } from "@/components/editor/homepage-hero-button";
import { ConditionalNewsImage } from "@/components/newsroom/conditional-news-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ARTICLE_IMAGE_ACCEPT,
  articleBodyToEditorHtml,
  buildArticlePayload,
  extractApiErrorMessage,
  htmlToArticleBody,
  validateEditorIssues,
  validateEditorValues,
  validateArticleImageFile,
} from "@/lib/article-editor";
import { hasPermission } from "@/lib/rbac";
import type { Role } from "@prisma/client";

type Option = { label: string; value: string };

type EditorInitialArticle = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: unknown;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: string;
  editionCode?: string;
  categorySlugs?: string[];
  tagSlugs?: string[];
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  isHomepageHero?: boolean;
};

export function NewsroomEditor({
  articleId,
  initialArticle,
  categoryOptions,
  editionOptions,
  currentUserRole,
}: {
  articleId?: string;
  initialArticle?: EditorInitialArticle;
  categoryOptions: Option[];
  editionOptions: Option[];
  currentUserRole: Role;
}) {
  const router = useRouter();
  const canPublish = hasPermission(currentUserRole, "articlePublish");
  const canDelete = hasPermission(currentUserRole, "articleDelete");
  const [activeView, setActiveView] = useState<"compose" | "preview">("compose");
  const [title, setTitle] = useState(initialArticle?.title ?? "");
  const [slug, setSlug] = useState(initialArticle?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt ?? "");
  const [seoTitle, setSeoTitle] = useState(initialArticle?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialArticle?.seoDescription ?? "");
  const [editionCode, setEditionCode] = useState(initialArticle?.editionCode ?? editionOptions[0]?.value ?? "AFRICA");
  const [tags, setTags] = useState((initialArticle?.tagSlugs ?? []).join(", "));
  const [categories, setCategories] = useState((initialArticle?.categorySlugs ?? []).join(", "));
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialArticle?.featuredImageUrl ?? "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(initialArticle?.featuredImageAlt ?? "");
  const [imagePreviewUrl, setImagePreviewUrl] = useState(initialArticle?.featuredImageUrl ?? "");
  const [imageFileName, setImageFileName] = useState("");
  const [currentStatus, setCurrentStatus] = useState(initialArticle?.status ?? "DRAFT");
  const [imageUploadState, setImageUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageUploadMessage, setImageUploadMessage] = useState("");
  const [imageUploadError, setImageUploadError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState(articleId ? "Autosave ready" : "Draft not saved yet");
  const [preview, setPreview] = useState<"desktop" | "mobile">("desktop");
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "publishing">("idle");
  const [deleteState, setDeleteState] = useState<"idle" | "deleting">("idle");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [currentArticleId, setCurrentArticleId] = useState(articleId ?? initialArticle?.id ?? "");
  const [publicArticleHref, setPublicArticleHref] = useState(
    initialArticle?.slug && initialArticle?.status === "PUBLISHED" ? `/articles/${initialArticle.slug}` : "",
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobPreviewRef = useRef<string | null>(null);
  const featuredImageUrlRef = useRef(initialArticle?.featuredImageUrl ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension,
      Image,
      Placeholder.configure({
        placeholder: "Write with verified sourcing, precise context, and publish-ready structure...",
      }),
    ],
    content: articleBodyToEditorHtml(initialArticle?.body),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[460px] rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-white px-7 py-6 text-[1.01rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] focus:outline-none",
      },
    },
  });

  const previewMarkup = useMemo(() => editor?.getHTML() ?? "", [editor]);
  const previewBody = useMemo(() => htmlToArticleBody(previewMarkup), [previewMarkup]);

  function logSubmitDebug(label: string, payload: unknown) {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    console.info(label, payload);
  }

  useEffect(() => {
    if (!currentArticleId || !editor || submitState !== "idle") {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setAutosaveStatus("Saving...");
      const response = await fetch(`/api/rest/articles/${currentArticleId}/autosave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          body: htmlToArticleBody(editor.getHTML()),
        }),
      });

      setAutosaveStatus(response.ok ? "Saved just now" : "Autosave unavailable");
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [currentArticleId, editor, excerpt, previewMarkup, submitState, title]);

  useEffect(() => {
    return () => {
      if (blobPreviewRef.current) {
        URL.revokeObjectURL(blobPreviewRef.current);
      }
    };
  }, []);

  function clearLocalImagePreview() {
    if (blobPreviewRef.current) {
      URL.revokeObjectURL(blobPreviewRef.current);
      blobPreviewRef.current = null;
    }
  }

  function commitFeaturedImageUrl(nextValue: string) {
    featuredImageUrlRef.current = nextValue;
    setFeaturedImageUrl(nextValue);
  }

  async function handleImageFile(file: File) {
    await uploadArticleImage(file);
  }

  function handleImageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    void handleImageFile(file);
  }

  async function uploadArticleImage(file: File) {
    const validationError = validateArticleImageFile(file);
    if (validationError) {
      setImageUploadState("error");
      setImageUploadProgress(0);
      setImageUploadError(validationError);
      setImageUploadMessage("");
      return;
    }

    clearLocalImagePreview();
    const previewUrl = URL.createObjectURL(file);
    blobPreviewRef.current = previewUrl;
    setImagePreviewUrl(previewUrl);
    setImageFileName(file.name);
    setImageUploadState("uploading");
    setImageUploadProgress(1);
    setImageUploadError("");
    setImageUploadMessage("Preparing image upload...");

    try {
      const presignResponse = await fetch("/api/rest/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          type: "IMAGE",
          title: title.trim() || file.name,
          altText: featuredImageAlt.trim() || title.trim() || file.name,
          articleId: currentArticleId || null,
        }),
      });

      const presignBody = await presignResponse.json().catch(() => null);
      console.info("Featured image presign response", {
        status: presignResponse.status,
        ok: presignResponse.ok,
        body: presignBody,
      });
      if (!presignResponse.ok) {
        throw new Error(extractApiErrorMessage(presignBody, "Unable to prepare image upload."));
      }

      const signedUpload = presignBody?.data?.upload as { uploadUrl?: string; publicUrl?: string } | undefined;
      if (!signedUpload?.uploadUrl || !signedUpload.publicUrl) {
        throw new Error("Invalid upload response.");
      }
      const uploadUrl = signedUpload.uploadUrl;
      const publicUrl = signedUpload.publicUrl;
      console.info("Prepared featured image upload", {
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        uploadUrl,
        publicUrl,
      });

      setImageUploadMessage("Uploading image...");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = false;
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.onloadstart = () => {
          console.info("Starting featured image upload", {
            fileName: file.name,
            contentType: file.type,
            uploadUrl,
            withCredentials: xhr.withCredentials,
          });
        };
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setImageUploadProgress(Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100))));
          }
        };
        xhr.onload = () => {
          const responseHeaders = typeof xhr.getAllResponseHeaders === "function" ? xhr.getAllResponseHeaders() : "";
          console.info("Featured image upload completed", {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText,
            responseHeaders,
            uploadUrl,
          });
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }

          reject(new Error(`Image upload failed with status ${xhr.status}. ${xhr.responseText || "No response body returned by storage."}`));
        };
        xhr.onerror = () => {
          console.error("Featured image upload network error", {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText,
            uploadUrl,
            fileName: file.name,
            contentType: file.type,
            withCredentials: xhr.withCredentials,
            hint: "A status of 0 usually means CORS, preflight rejection, DNS, or network failure at the storage provider.",
          });
          reject(new Error("Image upload failed while sending data to storage. Check the browser console and Cloudflare R2 CORS configuration."));
        };
        xhr.onabort = () => {
          console.error("Featured image upload aborted", {
            status: xhr.status,
            statusText: xhr.statusText,
            uploadUrl,
          });
          reject(new Error("Image upload was aborted before completion."));
        };
        xhr.send(file);
      });

      clearLocalImagePreview();
      commitFeaturedImageUrl(publicUrl);
      setImagePreviewUrl(publicUrl);
      setImageUploadProgress(100);
      setImageUploadState("success");
      setImageUploadError("");
      setImageUploadMessage("Image uploaded successfully.");
      console.info("Featured image uploaded", {
        articleId: currentArticleId || null,
        publicUrl,
      });
    } catch (error) {
      setImageUploadState("error");
      setImageUploadProgress(0);
      setImageUploadError(error instanceof Error ? error.message : "Image upload failed.");
      setImageUploadMessage("");
    }
  }

  function handleImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    void handleImageFile(file);
  }

  function removeArticleImage() {
    clearLocalImagePreview();
    commitFeaturedImageUrl("");
    setImagePreviewUrl("");
    setImageFileName("");
    setImageUploadState("idle");
    setImageUploadProgress(0);
    setImageUploadError("");
    setImageUploadMessage("");
  }

  async function deleteArticle() {
    if (!currentArticleId || deleteState !== "idle") {
      return;
    }

    setDeleteState("deleting");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/rest/articles/${currentArticleId}`, {
        method: "DELETE",
      });
      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractApiErrorMessage(responseBody, "Unable to delete article."));
      }

      setIsDeleteDialogOpen(false);
      setSuccessMessage("Article deleted successfully.");
      router.push("/dashboard/editor");
      router.refresh();
    } catch (error) {
      setErrorMessage(`Delete failed. ${error instanceof Error ? error.message : "Unable to delete article."}`);
    } finally {
      setDeleteState("idle");
    }
  }

  async function submitArticle(intent: "draft" | "publish") {
    if (!editor) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setValidationIssues([]);

    const editorValues = {
      title,
      slug,
      excerpt,
      categories,
      tags,
      editionCode,
      seoTitle,
      seoDescription,
      featuredImageUrl,
      featuredImageAlt,
    };
    const issues = validateEditorIssues(editorValues, editor.getHTML());

    const validationError = validateEditorValues(
      editorValues,
      editor.getHTML(),
    );

    if (validationError) {
      logSubmitDebug("Article validation blocked submit", {
        intent,
        issues,
      });
      setErrorMessage(intent === "publish" ? "Publishing failed." : "Draft save failed.");
      setValidationIssues(issues);
      return;
    }

    if (intent === "publish" && !canPublish) {
      setErrorMessage("Publishing failed. Your role does not have permission to publish articles.");
      return;
    }

    setSubmitState(intent === "publish" ? "publishing" : "saving");
    setAutosaveStatus(intent === "publish" ? "Publishing..." : "Saving draft...");

    try {
      const payload = buildArticlePayload(
        {
          title,
          slug,
          excerpt,
          categories,
          tags,
          editionCode,
          seoTitle,
          seoDescription,
          featuredImageUrl: featuredImageUrlRef.current,
          featuredImageAlt,
        },
        editor.getHTML(),
        intent,
      );
      logSubmitDebug("Submitting article payload", {
        articleId: currentArticleId || null,
        intent,
        featuredImageUrl: payload.featuredImageUrl,
        payload,
      });

      const method = currentArticleId ? "PATCH" : "POST";
      const endpoint = currentArticleId ? `/api/rest/articles/${currentArticleId}` : "/api/rest/articles";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseBody = (await response.json().catch(() => null)) as { data?: { id: string; slug: string; status?: string } } | null;
      logSubmitDebug("Article submit response", {
        articleId: currentArticleId || null,
        intent,
        status: response.status,
        ok: response.ok,
        body: responseBody,
      });
      if (!response.ok) {
        const reason = extractApiErrorMessage(
          responseBody,
          intent === "publish" ? "Unable to publish article." : "Unable to save draft.",
        );
        setErrorMessage(`${intent === "publish" ? "Publishing failed" : "Draft save failed"}. ${reason}`);
        setSubmitState("idle");
        setAutosaveStatus(intent === "publish" ? "Publish failed" : "Draft save failed");
        return;
      }

      const nextArticleId = responseBody?.data?.id ?? currentArticleId;
      const nextSlug = responseBody?.data?.slug ?? payload.slug;
      setCurrentArticleId(nextArticleId);
      setCurrentStatus(responseBody?.data?.status ?? (intent === "publish" ? "PUBLISHED" : "DRAFT"));
      if (intent === "publish") {
        setPublicArticleHref(`/articles/${nextSlug}`);
      }
      setSuccessMessage(
        intent === "publish"
          ? "Article published successfully."
          : "Draft saved successfully.",
      );
      setAutosaveStatus(intent === "publish" ? "Published just now" : "Draft saved just now");
      setSubmitState("idle");
      if (nextArticleId) {
        setCurrentArticleId(nextArticleId);
      }
    } catch (error) {
      logSubmitDebug("Article submit request failed", {
        articleId: currentArticleId || null,
        intent,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
      setErrorMessage(
        `${intent === "publish" ? "Publishing failed" : "Draft save failed"}. ${
          error instanceof Error ? error.message : "Unable to save article."
        }`,
      );
      setSubmitState("idle");
      setAutosaveStatus(intent === "publish" ? "Publish failed" : "Draft save failed");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        {errorMessage ? (
          <div className="rounded-[22px] border border-[#D8261D]/20 bg-[#D8261D]/8 px-4 py-3 text-sm text-[#8A1C16]">
            <p>{errorMessage}</p>
            {validationIssues.length ? (
              <ul className="mt-2 list-disc pl-5">
                {validationIssues.map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            ) : null}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        <Card className="rounded-[32px] border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.82)] shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <CardContent className="space-y-6 p-5 sm:p-7">
            <div className="space-y-2">
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Article
              </div>
              <Input
                placeholder="Article headline"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-14 rounded-[22px] border-[rgba(15,23,42,0.08)] bg-white px-5 text-lg font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Slug
                </div>
                <Input
                  placeholder="Slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className="h-12 rounded-[18px] border-[rgba(15,23,42,0.08)] bg-white px-4"
                />
              </div>
              <div className="space-y-2">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Category
                </div>
                <Input
                  placeholder="Categories, comma separated"
                  value={categories}
                  onChange={(event) => setCategories(event.target.value)}
                  list="category-options"
                  className="h-12 rounded-[18px] border-[rgba(15,23,42,0.08)] bg-white px-4"
                />
                <datalist id="category-options">
                  {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Summary
              </div>
              <Textarea
                placeholder="Excerpt"
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                className="min-h-[110px] rounded-[22px] border-[rgba(15,23,42,0.08)] bg-white px-5 py-4 leading-7"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.82)] shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <CardContent className="space-y-5 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Featured image
                </div>
                <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Upload or drop a lead visual for this story.
                </div>
              </div>
              {(featuredImageUrl || imagePreviewUrl) ? (
                <Button type="button" variant="outline" onClick={removeArticleImage} disabled={imageUploadState === "uploading"}>
                  Remove
                </Button>
              ) : null}
            </div>

            <div
              role="button"
              aria-label="Upload image"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragActive(false);
              }}
              onDrop={handleImageDrop}
              className={`relative overflow-hidden rounded-[28px] border border-dashed px-5 py-6 transition-colors ${
                isDragActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[rgba(15,23,42,0.12)] bg-[rgba(248,245,239,0.72)]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ARTICLE_IMAGE_ACCEPT}
                className="hidden"
                onChange={handleImageInputChange}
              />

              {featuredImageUrl || imagePreviewUrl ? (
                <div className="space-y-4">
                  <ConditionalNewsImage
                    src={imagePreviewUrl || featuredImageUrl}
                    alt={featuredImageAlt || title || "Article image preview"}
                    sizes="(max-width: 1280px) 100vw, 720px"
                    containerClassName="relative h-72 overflow-hidden rounded-[24px] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                    imageClassName="object-cover object-center"
                  />
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
                    <span>{imageFileName || "Uploaded image ready"}</span>
                    {imageUploadState === "success" ? <span className="text-emerald-700">Upload complete</span> : null}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[250px] flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--accent)] shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-[var(--foreground)]">Drop image here</div>
                    <div className="text-sm text-[var(--muted-foreground)]">Drag and drop or click to browse.</div>
                  </div>
                </div>
              )}
            </div>

            {imageUploadState === "uploading" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  <span>Uploading</span>
                  <span>{imageUploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${imageUploadProgress}%` }} />
                </div>
              </div>
            ) : null}
            {imageUploadMessage ? <p className="text-sm text-emerald-700">{imageUploadMessage}</p> : null}
            {imageUploadError ? <p className="text-sm text-[#8A1C16]">{imageUploadError}</p> : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <Input
                placeholder="Image URL"
                value={featuredImageUrl}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  clearLocalImagePreview();
                  commitFeaturedImageUrl(nextValue);
                  setImagePreviewUrl(nextValue);
                  setImageUploadState("idle");
                  setImageUploadProgress(0);
                  setImageUploadError("");
                  setImageUploadMessage("");
                  setImageFileName("");
                }}
                className="h-12 rounded-[18px] border-[rgba(15,23,42,0.08)] bg-white px-4"
              />
              <Input
                placeholder="Image alt text"
                value={featuredImageAlt}
                onChange={(event) => setFeaturedImageAlt(event.target.value)}
                className="h-12 rounded-[18px] border-[rgba(15,23,42,0.08)] bg-white px-4"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.82)] shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <CardContent className="space-y-5 p-5 sm:p-7">
            <div className="flex flex-col gap-4 border-b border-[rgba(15,23,42,0.08)] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Story body
                </div>
                <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Build the article with editorial structure and clean formatting.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Button>
                <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Button>
                <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /> Quote</Button>
                <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBulletList().run()}>Bullets</Button>
              </div>
            </div>

            {activeView === "compose" ? (
              <EditorContent editor={editor} />
            ) : (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <Button variant={preview === "desktop" ? "default" : "outline"} size="sm" onClick={() => setPreview("desktop")}><Laptop className="h-4 w-4" /> Desktop</Button>
                  <Button variant={preview === "mobile" ? "default" : "outline"} size="sm" onClick={() => setPreview("mobile")}><Smartphone className="h-4 w-4" /> Mobile</Button>
                </div>
                <div className={preview === "mobile" ? "mx-auto max-w-sm" : ""}>
                  <div className="rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-white p-8 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
                    <div className="text-sm text-[var(--muted-foreground)]">{editionOptions.find((item) => item.value === editionCode)?.label ?? editionCode}</div>
                    <h1 className="mt-3 font-serif text-4xl leading-tight">{title || "Headline preview"}</h1>
                    <p className="mt-4 text-[var(--muted-foreground)]">{excerpt || "Preview the article before publishing."}</p>
                    <ConditionalNewsImage
                      src={featuredImageUrl}
                      alt={featuredImageAlt || title || "Article image"}
                      sizes="(max-width: 1024px) 100vw, 900px"
                      containerClassName="relative mt-6 h-[260px] overflow-hidden rounded-[24px] border border-[rgba(15,23,42,0.08)]"
                      imageClassName="object-cover object-center"
                    />
                    <div className="mt-8">
                      <ArticleBody body={previewBody} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
        <Card className="rounded-[30px] border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.9)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-5 p-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Publishing</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Keep the story ready to save, preview, and publish.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Status</div>
                <Select value={currentStatus} disabled>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Category</div>
                <Input
                  placeholder="technology"
                  value={categories}
                  onChange={(event) => setCategories(event.target.value)}
                  list="category-options"
                  className="h-12 rounded-[18px] border-[rgba(15,23,42,0.08)] bg-white px-4"
                />
              </div>

              <div className="space-y-2">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Region</div>
                <Select value={editionCode} onChange={(event) => setEditionCode(event.target.value)}>
                  {editionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveView(activeView === "compose" ? "preview" : "compose")}>
                <Eye className="h-4 w-4" />
                {activeView === "compose" ? "Preview" : "Back to Editor"}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => void submitArticle("draft")}
                disabled={submitState !== "idle"}
              >
                {submitState === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {submitState === "saving" ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                className="w-full justify-start bg-[#D8261D] hover:bg-[#bf1f18]"
                onClick={() => void submitArticle("publish")}
                disabled={submitState !== "idle" || !canPublish}
              >
                {submitState === "publishing" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                {submitState === "publishing" ? "Publishing..." : "Publish"}
              </Button>
              {currentArticleId ? (
                <HomepageHeroButton
                  articleId={currentArticleId}
                  isHomepageHero={Boolean(initialArticle?.isHomepageHero && currentStatus === "PUBLISHED")}
                  disabled={currentStatus !== "PUBLISHED"}
                />
              ) : null}
              {currentArticleId && canDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start border-[#D8261D]/25 text-[#8A1C16] hover:bg-[#D8261D]/8 hover:text-[#8A1C16]"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={deleteState !== "idle"}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Article
                </Button>
              ) : null}
            </div>

            <div className="space-y-3 rounded-[22px] bg-[rgba(243,240,234,0.88)] p-4 text-sm">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <LoaderCircle className="h-4 w-4" />
                {autosaveStatus}
              </div>
              {publicArticleHref ? (
                <Link href={publicArticleHref} className="inline-flex items-center gap-2 font-medium text-[var(--accent)] underline underline-offset-4">
                  View published article
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <details className="group rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.86)] shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
            <div>
              <div className="text-base font-semibold text-[var(--foreground)]">SEO Settings</div>
              <div className="text-sm text-[var(--muted-foreground)]">Title, description, and search-facing copy.</div>
            </div>
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-4 px-5 pb-5">
            <Input placeholder="SEO title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} className="h-12 rounded-[18px] border-[rgba(15,23,42,0.08)] bg-white px-4" />
            <Textarea placeholder="Meta description" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} className="min-h-[120px] rounded-[20px] border-[rgba(15,23,42,0.08)] bg-white px-4 py-3" />
          </div>
        </details>

        <details className="group rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.86)] shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
            <div>
              <div className="text-base font-semibold text-[var(--foreground)]">Metadata</div>
              <div className="text-sm text-[var(--muted-foreground)]">Tags and region context for distribution.</div>
            </div>
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-4 px-5 pb-5">
            <div className="space-y-2">
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Tags</div>
              <Input placeholder="Tags, comma separated" value={tags} onChange={(event) => setTags(event.target.value)} className="h-12 rounded-[18px] border-[rgba(15,23,42,0.08)] bg-white px-4" />
            </div>
            <div className="rounded-[20px] bg-[rgba(243,240,234,0.88)] p-4 text-sm text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                <Globe2 className="h-4 w-4 text-[var(--accent)]" />
                {editionOptions.find((item) => item.value === editionCode)?.label ?? editionCode}
              </div>
              <div className="mt-2">Use this panel for discoverability details while keeping the main workspace focused on writing.</div>
            </div>
          </div>
        </details>
      </aside>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete article?</DialogTitle>
            <DialogDescription>
              This will archive the article and remove it from public listings, search, feeds, and sitemap output after revalidation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteState === "deleting"}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#D8261D] hover:bg-[#bf1f18]"
              onClick={() => void deleteArticle()}
              disabled={deleteState === "deleting"}
            >
              {deleteState === "deleting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleteState === "deleting" ? "Deleting..." : "Delete Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

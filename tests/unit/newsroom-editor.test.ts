import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Role } from "@prisma/client";
import { NewsroomEditor } from "@/components/editor/newsroom-editor";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));

const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    refresh: routerRefresh,
  }),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

vi.mock("@tiptap/react", () => ({
  useEditor: () => ({
    getHTML: () => "<p>Lead paragraph.</p>",
    chain: () => ({
      focus: () => ({
        toggleHeading: () => ({ run: () => undefined }),
        toggleBlockquote: () => ({ run: () => undefined }),
        toggleBulletList: () => ({ run: () => undefined }),
      }),
    }),
  }),
  EditorContent: () => createElement("div", { "data-testid": "editor-content" }),
}));

const categoryOptions = [{ label: "Technology", value: "technology" }];
const editionOptions = [{ label: "United States", value: "UNITED_STATES" }];

function getHeroSliderSelect() {
  return screen.getByDisplayValue("No");
}

function getLocalDateAndTimeParts(value: string) {
  const parsed = new Date(value);
  const pad = (input: number) => String(input).padStart(2, "0");

  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  };
}

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText("Article headline"), {
    target: { value: "Global chip alliances reshape AI infrastructure competition" },
  });
  fireEvent.change(screen.getByPlaceholderText("Slug"), {
    target: { value: "global-chip-alliances" },
  });
  fireEvent.change(screen.getByPlaceholderText("Excerpt"), {
    target: {
      value:
        "Governments and hyperscale platforms are redrawing semiconductor strategy around energy, supply chains, and sovereign cloud capacity.",
    },
  });
  fireEvent.change(screen.getByPlaceholderText("Categories, comma separated"), {
    target: { value: "technology" },
  });
}

describe("NewsroomEditor upload support", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    routerPush.mockReset();
    routerRefresh.mockReset();
    if (!("createObjectURL" in URL)) {
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: vi.fn(() => "blob:preview-image"),
      });
    } else {
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview-image");
    }

    if (!("revokeObjectURL" in URL)) {
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: vi.fn(),
      });
    } else {
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    }
  });

  it("renders the image upload field", () => {
    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    expect(screen.getByRole("button", { name: "Upload image" })).toBeVisible();
    expect(screen.getByPlaceholderText("Image URL")).toBeVisible();
  });

  it("rejects unsupported file types", () => {
    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["not an image"], "bad.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("Upload JPG, PNG, or WEBP files only.")).toBeVisible();
  });

  it("rejects oversized images before requesting a presigned upload", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "too-large.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("Image must be 10MB or smaller.")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an uploaded image preview and saves the public url", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            upload: {
              uploadUrl: "https://storage.local/upload/one",
              publicUrl: "https://cdn.example.com/images/article.png",
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: "article-1", slug: "global-chip-alliances" } }),
      });
    vi.stubGlobal("fetch", fetchMock);

    class MockXHR {
      status = 200;
      upload = {
        onprogress: null as null | ((event: ProgressEvent) => void),
      };
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      open = vi.fn();
      setRequestHeader = vi.fn();
      send = () => {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 } as ProgressEvent);
        this.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 } as ProgressEvent);
        this.onload?.();
      };
    }
    vi.stubGlobal("XMLHttpRequest", MockXHR);

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "image.png", { type: "image/png" });
    await user.upload(input, file);

    expect(await screen.findByRole("img", { name: "Article image preview" })).toBeVisible();
    await waitFor(() => expect(screen.getByText("Image uploaded successfully.")).toBeVisible());

    fillRequiredFields();
    await user.click(screen.getByRole("button", { name: "Save Draft" }));

    expect(await screen.findByText("Draft saved successfully.")).toBeVisible();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/rest/articles",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const presignBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(presignBody.sizeBytes).toBe(3);

    const requestBody = JSON.parse((fetchMock.mock.calls[1]?.[1] as RequestInit).body as string);
    expect(requestBody.featuredImageUrl).toBe("https://cdn.example.com/images/article.png");
    expect(requestBody.seoTitle).toBeNull();
    expect(requestBody.seoDescription).toBeNull();
  }, 15000);

  it("shows a publishing loading state and success feedback", async () => {
    let resolvePublish: ((value: { ok: boolean; json: () => Promise<{ data: { id: string; slug: string } }> }) => void) | null = null;
    const publishPromise = new Promise<{ ok: boolean; json: () => Promise<{ data: { id: string; slug: string } }> }>((resolve) => {
      resolvePublish = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(publishPromise);
    vi.stubGlobal("fetch", fetchMock);

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(screen.getByRole("button", { name: "Publishing..." })).toBeDisabled();

    resolvePublish?.({
      ok: true,
      json: async () => ({ data: { id: "article-7", slug: "global-chip-alliances" } }),
    });

    expect(await screen.findByText("Article published successfully.")).toBeVisible();
    expect(screen.getByRole("link", { name: "View published article" })).toHaveAttribute("href", "/articles/global-chip-alliances");
  }, 15000);

  it("shows publish failure details from the API", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Slug already exists." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    fillRequiredFields();
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Publishing failed. Slug already exists.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  }, 15000);

  it("shows backend field-level validation errors", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "Invalid article payload",
        issues: {
          fieldErrors: {
            seoTitle: ["SEO Title must be 70 characters or fewer."],
            heroStartAt: ["Hero Start date is invalid."],
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    fillRequiredFields();
    fireEvent.change(getHeroSliderSelect(), { target: { value: "yes" } });
    await user.click(screen.getByRole("button", { name: /Schedule start/i }));
    fireEvent.change(screen.getByLabelText("Start Date"), {
      target: { value: "2026-06-26" },
    });
    fireEvent.change(screen.getByLabelText("Start Time"), {
      target: { value: "11:30" },
    });
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect((await screen.findAllByText("SEO Title must be 70 characters or fewer.")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hero Start date is invalid.").length).toBeGreaterThan(0);
  }, 15000);

  it("shows visible validation issues when publish is blocked", async () => {
    const user = userEvent.setup();

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Publishing failed.")).toBeVisible();
    expect(screen.getAllByText("Title required.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Slug required.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Summary required.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Category required.").length).toBeGreaterThan(0);
  });

  it("keeps manual image url fallback working", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "article-2", slug: "manual-image-story" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    fillRequiredFields();
    fireEvent.change(screen.getByPlaceholderText("Slug"), {
      target: { value: "manual-image-story" },
    });
    fireEvent.change(screen.getByPlaceholderText("Image URL"), {
      target: { value: "https://cdn.example.com/manual.jpg" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/rest/articles",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const requestBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(requestBody.featuredImageUrl).toBe("https://cdn.example.com/manual.jpg");
  });

  it("hides the hero schedule card until homepage hero is enabled", async () => {
    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    expect(screen.queryByText("Homepage Hero Schedule")).not.toBeInTheDocument();

    fireEvent.change(getHeroSliderSelect(), { target: { value: "yes" } });

    expect(screen.getByText("Homepage Hero Schedule")).toBeVisible();
    expect(screen.getByText("Homepage Hero enabled")).toBeVisible();
  });

  it("submits null hero fields when homepage hero is disabled", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "article-2", slug: "global-chip-alliances" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/rest/articles",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const requestBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(requestBody.heroStartAt).toBeNull();
    expect(requestBody.heroEndAt).toBeNull();
    expect(requestBody.heroPriority).toBeNull();
  });

  it("normalizes scheduled hero values to ISO before submit", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "article-2", slug: "scheduled-story" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    fillRequiredFields();
    fireEvent.change(screen.getByPlaceholderText("Slug"), {
      target: { value: "scheduled-story" },
    });
    fireEvent.change(getHeroSliderSelect(), { target: { value: "yes" } });
    await user.click(screen.getByRole("button", { name: /Schedule start/i }));
    fireEvent.change(screen.getByLabelText("Start Date"), {
      target: { value: "2026-06-26" },
    });
    fireEvent.change(screen.getByLabelText("Start Time"), {
      target: { value: "11:30" },
    });
    await user.click(screen.getByRole("checkbox", { name: /Remove from hero automatically/i }));
    fireEvent.change(screen.getByLabelText("End Date"), {
      target: { value: "2026-07-03" },
    });
    fireEvent.change(screen.getByLabelText("End Time"), {
      target: { value: "12:45" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/rest/articles",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const requestBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(requestBody.heroStartAt).toBe(new Date(2026, 5, 26, 11, 30, 0, 0).toISOString());
    expect(requestBody.heroEndAt).toBe(new Date(2026, 6, 3, 12, 45, 0, 0).toISOString());
  });

  it("uses the current ISO datetime when hero start is immediate", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-26T10:30:00.000Z"));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "article-2", slug: "immediate-hero-story" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    fillRequiredFields();
    fireEvent.change(screen.getByPlaceholderText("Slug"), {
      target: { value: "immediate-hero-story" },
    });
    fireEvent.change(getHeroSliderSelect(), { target: { value: "yes" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/rest/articles",
      expect.objectContaining({ method: "POST" }),
    );

    const requestBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(requestBody.heroStartAt).toBe("2026-06-26T10:30:00.000Z");
    expect(requestBody.heroEndAt).toBeNull();
    expect(requestBody.heroPriority).toBe(100);
  });

  it("requires end date and time when auto-removal is enabled", async () => {
    const user = userEvent.setup();

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    fillRequiredFields();
    fireEvent.change(getHeroSliderSelect(), { target: { value: "yes" } });
    await user.click(screen.getByRole("button", { name: /Schedule start/i }));
    fireEvent.change(screen.getByLabelText("Start Date"), {
      target: { value: "2026-06-26" },
    });
    fireEvent.change(screen.getByLabelText("Start Time"), {
      target: { value: "11:30" },
    });
    await user.click(screen.getByRole("checkbox", { name: /Remove from hero automatically/i }));
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Publishing failed.")).toBeVisible();
    expect(screen.getAllByText("End date is required when auto-removal is enabled.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("End time is required when auto-removal is enabled.").length).toBeGreaterThan(0);
  });

  it("hydrates existing ISO hero dates into the schedule controls", () => {
    render(
      createElement(NewsroomEditor, {
        initialArticle: {
          id: "article-10",
          title: "Edited story",
          slug: "edited-story",
          excerpt: "Existing excerpt with enough detail to satisfy editorial validation rules.",
          status: "DRAFT",
          editionCode: "UNITED_STATES",
          categorySlugs: ["technology"],
          showOnHero: true,
          heroStartAt: "2026-06-26T11:30:00.000Z",
          heroEndAt: "2026-07-03T12:45:00.000Z",
          heroPriority: 7,
        },
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    const expectedStart = getLocalDateAndTimeParts("2026-06-26T11:30:00.000Z");
    const expectedEnd = getLocalDateAndTimeParts("2026-07-03T12:45:00.000Z");

    expect(screen.getByText("Homepage Hero Schedule")).toBeVisible();
    expect(screen.getByLabelText("Start Date")).toHaveValue(expectedStart.date);
    expect(screen.getByLabelText("Start Time")).toHaveValue(expectedStart.time);
    expect(screen.getByRole("checkbox", { name: /Remove from hero automatically/i })).toBeChecked();
    expect(screen.getByLabelText("End Date")).toHaveValue(expectedEnd.date);
    expect(screen.getByLabelText("End Time")).toHaveValue(expectedEnd.time);
    expect(screen.getByLabelText("Hero Priority")).toHaveValue(7);
  });

  it("shows a field-level error when hero end is before hero start", async () => {
    const user = userEvent.setup();

    render(
      createElement(NewsroomEditor, {
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    fillRequiredFields();
    fireEvent.change(getHeroSliderSelect(), { target: { value: "yes" } });
    await user.click(screen.getByRole("button", { name: /Schedule start/i }));
    fireEvent.change(screen.getByLabelText("Start Date"), {
      target: { value: "2026-06-26" },
    });
    fireEvent.change(screen.getByLabelText("Start Time"), {
      target: { value: "11:30" },
    });
    await user.click(screen.getByRole("checkbox", { name: /Remove from hero automatically/i }));
    fireEvent.change(screen.getByLabelText("End Date"), {
      target: { value: "2026-06-26" },
    });
    fireEvent.change(screen.getByLabelText("End Time"), {
      target: { value: "10:30" },
    });
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Publishing failed.")).toBeVisible();
    expect(screen.getAllByText("Hero End must be after Hero Start.").length).toBeGreaterThan(0);
  });

  it("uses PATCH when editing an existing article id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "article-99", slug: "edited-story", status: "DRAFT" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      createElement(NewsroomEditor, {
        articleId: "article-99",
        initialArticle: {
          id: "article-99",
          title: "Edited story",
          slug: "edited-story",
          excerpt: "Existing excerpt with enough detail to satisfy editorial validation rules.",
          status: "DRAFT",
          editionCode: "UNITED_STATES",
          categorySlugs: ["technology"],
        },
        categoryOptions,
        editionOptions,
        currentUserRole: Role.MANAGING_EDITOR,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/rest/articles/article-99",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("shows a delete confirmation modal and deletes the current article", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "article-99", slug: "edited-story" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      createElement(NewsroomEditor, {
        articleId: "article-99",
        initialArticle: {
          id: "article-99",
          title: "Edited story",
          slug: "edited-story",
          excerpt: "Existing excerpt with enough detail to satisfy editorial validation rules.",
          status: "DRAFT",
          editionCode: "UNITED_STATES",
          categorySlugs: ["technology"],
        },
        categoryOptions,
        editionOptions,
        currentUserRole: Role.EDITOR_IN_CHIEF,
      }),
    );

    const openDeleteButton = screen.getAllByRole("button", { name: "Delete Article" })
      .find((button) => !button.closest("[role='dialog']"));

    expect(openDeleteButton).toBeDefined();
    await user.click(openDeleteButton!);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeVisible();

    await user.click(within(dialog).getByRole("button", { name: "Delete Article" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/rest/articles/article-99",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(routerPush).toHaveBeenCalledWith("/dashboard/editor");
    expect(routerRefresh).toHaveBeenCalled();
  });
});

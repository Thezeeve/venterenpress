import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Role } from "@prisma/client";
import { NewsroomEditor } from "@/components/editor/newsroom-editor";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) =>
    createElement("img", { src, alt, ...props }),
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

describe("NewsroomEditor upload support", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

    await user.type(screen.getByPlaceholderText("Article headline"), "Global chip alliances reshape AI infrastructure competition");
    await user.type(screen.getByPlaceholderText("Slug"), "global-chip-alliances");
    await user.type(
      screen.getByPlaceholderText("Excerpt"),
      "Governments and hyperscale platforms are redrawing semiconductor strategy around energy, supply chains, and sovereign cloud capacity.",
    );
    await user.type(screen.getByPlaceholderText("Categories, comma separated"), "technology");
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
  }, 15000);

  it("shows a publishing loading state and success feedback", async () => {
    const user = userEvent.setup();
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

    await user.type(screen.getByPlaceholderText("Article headline"), "Global chip alliances reshape AI infrastructure competition");
    await user.type(screen.getByPlaceholderText("Slug"), "global-chip-alliances");
    await user.type(
      screen.getByPlaceholderText("Excerpt"),
      "Governments and hyperscale platforms are redrawing semiconductor strategy around energy, supply chains, and sovereign cloud capacity.",
    );
    await user.type(screen.getByPlaceholderText("Categories, comma separated"), "technology");
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(screen.getByRole("button", { name: "Publishing..." })).toBeDisabled();

    resolvePublish?.({
      ok: true,
      json: async () => ({ data: { id: "article-7", slug: "global-chip-alliances" } }),
    });

    expect(await screen.findByText("Article published successfully.")).toBeVisible();
    expect(screen.getByRole("link", { name: "View published article" })).toHaveAttribute("href", "/articles/global-chip-alliances");
  });

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

    await user.type(screen.getByPlaceholderText("Article headline"), "Global chip alliances reshape AI infrastructure competition");
    await user.type(screen.getByPlaceholderText("Slug"), "global-chip-alliances");
    await user.type(
      screen.getByPlaceholderText("Excerpt"),
      "Governments and hyperscale platforms are redrawing semiconductor strategy around energy, supply chains, and sovereign cloud capacity.",
    );
    await user.type(screen.getByPlaceholderText("Categories, comma separated"), "technology");
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Publishing failed. Slug already exists.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  });

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
    expect(screen.getByText("Title required.")).toBeVisible();
    expect(screen.getByText("Slug required.")).toBeVisible();
    expect(screen.getByText("Summary required.")).toBeVisible();
    expect(screen.getByText("Category required.")).toBeVisible();
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

    fireEvent.change(screen.getByPlaceholderText("Article headline"), {
      target: { value: "Global chip alliances reshape AI infrastructure competition" },
    });
    fireEvent.change(screen.getByPlaceholderText("Slug"), {
      target: { value: "manual-image-story" },
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
});

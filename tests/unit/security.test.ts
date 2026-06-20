import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getAllowedOrigins, isTrustedOrigin, validateBrowserMutation } from "@/lib/security";

describe("browser mutation origin validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXTAUTH_URL = "http://127.0.0.1:3000";
    process.env.NEXT_PUBLIC_SITE_URL = "https://vanterenpress.vercel.app";
    process.env.APP_URL = "https://vanterenpress.org";
  });

  it("allows configured localhost and production origins", () => {
    expect(getAllowedOrigins()).toEqual(
      expect.arrayContaining([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://venterenpress.vercel.app",
        "https://vanterenpress.vercel.app",
        "https://vanterenpress.org",
        "https://www.vanterenpress.org",
      ]),
    );
  });

  it("accepts the Vercel production origin", () => {
    const request = new NextRequest("https://vanterenpress.vercel.app/api/rest/media/presign", {
      method: "POST",
      headers: {
        origin: "https://vanterenpress.vercel.app",
        host: "vanterenpress.vercel.app",
      },
    });

    expect(isTrustedOrigin(request)).toBe(true);
    expect(validateBrowserMutation(request)).toEqual({ ok: true });
  });

  it("accepts the custom production domains", () => {
    const apexRequest = new NextRequest("https://vanterenpress.org/api/rest/media/presign", {
      method: "POST",
      headers: {
        origin: "https://vanterenpress.org",
        host: "vanterenpress.org",
      },
    });
    const wwwRequest = new NextRequest("https://www.vanterenpress.org/api/rest/media/presign", {
      method: "POST",
      headers: {
        referer: "https://www.vanterenpress.org/admin/articles/article-1/edit",
        host: "www.vanterenpress.org",
      },
    });

    expect(validateBrowserMutation(apexRequest)).toEqual({ ok: true });
    expect(validateBrowserMutation(wwwRequest)).toEqual({ ok: true });
  });

  it("rejects untrusted origins and logs the request details", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const request = new NextRequest("https://vanterenpress.vercel.app/api/rest/media/presign", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        host: "vanterenpress.vercel.app",
      },
    });

    expect(validateBrowserMutation(request)).toEqual({
      ok: false,
      error: "Invalid request origin",
    });
    expect(warning).toHaveBeenCalledWith(
      "Rejected browser mutation due to invalid request origin",
      expect.objectContaining({
        origin: "https://evil.example",
        referer: null,
        host: "vanterenpress.vercel.app",
        allowedOrigins: expect.arrayContaining(["https://vanterenpress.vercel.app"]),
      }),
    );
  });
});

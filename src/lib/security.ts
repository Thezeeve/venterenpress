import type { NextRequest } from "next/server";
import { siteConfig } from "@/lib/site";

export function isTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === siteConfig.url;
  } catch {
    return false;
  }
}

export function validateBrowserMutation(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return {
      ok: false as const,
      error: "Invalid request origin",
    };
  }

  return { ok: true as const };
}

export function clampString(input: unknown, maxLength: number) {
  return typeof input === "string" ? input.trim().slice(0, maxLength) : "";
}

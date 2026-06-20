import type { NextRequest } from "next/server";
import { siteConfig } from "@/lib/site";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://venterenpress.vercel.app",
  "https://vanterenpress.vercel.app",
  "https://vanterenpress.org",
  "https://www.vanterenpress.org",
];

function normalizeOrigin(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getAllowedOrigins() {
  return Array.from(
    new Set(
      [
        ...DEFAULT_ALLOWED_ORIGINS,
        siteConfig.url,
        process.env.APP_URL,
        process.env.NEXTAUTH_URL,
        process.env.NEXT_PUBLIC_SITE_URL,
      ]
        .map((value) => normalizeOrigin(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function getRequestOriginDetails(request: NextRequest) {
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  return {
    origin: normalizeOrigin(originHeader ?? undefined),
    referer: normalizeOrigin(refererHeader ?? undefined),
  };
}

export function isTrustedOrigin(request: NextRequest) {
  const { origin, referer } = getRequestOriginDetails(request);
  const comparableOrigin = origin ?? referer;
  if (!comparableOrigin) {
    return true;
  }

  return getAllowedOrigins().includes(comparableOrigin);
}

export function validateBrowserMutation(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    const allowedOrigins = getAllowedOrigins();
    const { origin, referer } = getRequestOriginDetails(request);
    console.warn("Rejected browser mutation due to invalid request origin", {
      origin,
      referer,
      host: request.headers.get("host"),
      allowedOrigins,
    });

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

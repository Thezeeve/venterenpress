import type { NextRequest } from "next/server";
import { siteConfig } from "@/lib/site";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://vanterenpress.vercel.app",
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

function getRequestOrigin(request: NextRequest) {
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    return normalizeOrigin(originHeader);
  }

  const refererHeader = request.headers.get("referer");
  return normalizeOrigin(refererHeader ?? undefined);
}

export function isTrustedOrigin(request: NextRequest) {
  const origin = getRequestOrigin(request);
  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(origin);
}

export function validateBrowserMutation(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    const allowedOrigins = getAllowedOrigins();
    console.warn("Rejected browser mutation due to invalid request origin", {
      origin: getRequestOrigin(request),
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

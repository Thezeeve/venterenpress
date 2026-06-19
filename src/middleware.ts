import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

type LimitRule = {
  test: RegExp;
  limit: number;
  windowMs: number;
};

const limitRules: LimitRule[] = [
  { test: /^\/api\/auth\//, limit: 12, windowMs: 60_000 },
  { test: /^\/api\/rest\/search(?:\/suggestions)?$/, limit: 80, windowMs: 60_000 },
  { test: /^\/api\/rest\/newsletter\/signup$/, limit: 8, windowMs: 15 * 60_000 },
  { test: /^\/api\/rest\/newsletters$/, limit: 15, windowMs: 60_000 },
  { test: /^\/api\/rest\/ai\//, limit: 15, windowMs: 60_000 },
  { test: /^\/api\/rest\/media(?:\/presign)?$/, limit: 20, windowMs: 60_000 },
  { test: /^\/api\/rest\/articles\/[^/]+\/public-comments$/, limit: 10, windowMs: 60_000 },
  { test: /^\/api\/rest\/articles\/[^/]+\/comments$/, limit: 20, windowMs: 60_000 },
  { test: /^\/api\/rest\/authors\/[^/]+\/follow$/, limit: 20, windowMs: 60_000 },
  { test: /^\/api\/rest\/subscriptions\/checkout$/, limit: 12, windowMs: 15 * 60_000 },
];
const protectedPathRules = [/^\/account(?:\/|$)/, /^\/dashboard(?:\/|$)/];

function getLimitRule(pathname: string) {
  return limitRules.find((rule) => rule.test.test(pathname));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();
  const csrfToken = request.cookies.get("gpn-csrf-token")?.value;

  if (!csrfToken) {
    response.cookies.set("gpn-csrf-token", crypto.randomUUID(), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  if (pathname.startsWith("/api/")) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const key = forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";
    const rule = getLimitRule(pathname);
    const result = checkRateLimit(
      `${key}:${pathname}`,
      rule?.limit ?? 120,
      rule?.windowMs ?? 60_000,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetAt: result.resetAt },
        { status: 429 },
      );
    }
  }

  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ??
    request.cookies.get("__Secure-next-auth.session-token")?.value ??
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (protectedPathRules.some((rule) => rule.test(pathname)) && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!request.cookies.get("gpn-meter-session")) {
    response.cookies.set("gpn-meter-session", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/account/:path*", "/dashboard/:path*"],
};

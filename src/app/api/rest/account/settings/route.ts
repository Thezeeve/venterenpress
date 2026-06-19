import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { validateBrowserMutation } from "@/lib/security";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      name: true,
      bio: true,
      locale: true,
      timezone: true,
      notificationPreferences: true,
      newsletterPreferences: true,
      email: true,
      image: true,
    },
  });

  return NextResponse.json({ data: user });
}

export async function POST(request: NextRequest) {
  const browserCheck = validateBrowserMutation(request);
  if (!browserCheck.ok) {
    return NextResponse.json({ error: browserCheck.error }, { status: 403 });
  }

  const auth = await requireApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json();
  const user = await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      name: typeof body?.name === "string" ? body.name.slice(0, 120) : undefined,
      bio: typeof body?.bio === "string" ? body.bio.slice(0, 1000) : undefined,
      locale: typeof body?.locale === "string" ? body.locale.slice(0, 20) : undefined,
      timezone: typeof body?.timezone === "string" ? body.timezone.slice(0, 64) : undefined,
      notificationPreferences: body?.notificationPreferences ?? undefined,
      newsletterPreferences: body?.newsletterPreferences ?? undefined,
    },
    select: {
      id: true,
      name: true,
      bio: true,
      locale: true,
      timezone: true,
      notificationPreferences: true,
      newsletterPreferences: true,
      email: true,
      image: true,
    },
  });

  return NextResponse.json({ data: user });
}

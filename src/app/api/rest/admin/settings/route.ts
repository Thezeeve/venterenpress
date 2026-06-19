import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/server-auth";
import { writeAuditLog } from "@/lib/audit";
import { clampString, validateBrowserMutation } from "@/lib/security";

export async function GET() {
  const auth = await requireApiUser("dashboardAccess");
  if (!auth.ok || auth.user.role !== "SUPER_ADMIN") {
    return auth.ok ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : auth.response;
  }

  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ data: settings });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser("dashboardAccess");
  if (!auth.ok || auth.user.role !== "SUPER_ADMIN") {
    return auth.ok ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : auth.response;
  }

  const browserCheck = validateBrowserMutation(request);
  if (!browserCheck.ok) {
    return NextResponse.json({ error: browserCheck.error }, { status: 403 });
  }

  const payload = await request.json();
  const entries = Array.isArray(payload?.settings) ? payload.settings : [];

  const saved = [];

  for (const item of entries) {
    const key = clampString(item?.key, 120);
    if (!key) {
      continue;
    }

    const value = item?.value ?? {};
    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    saved.push(setting);

    await writeAuditLog({
      userId: auth.user.id,
      action: "site_setting_update",
      resource: key,
      metadata: { value },
    });
  }

  return NextResponse.json({ data: saved });
}

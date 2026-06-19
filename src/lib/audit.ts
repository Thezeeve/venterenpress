import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  userId: string;
  action: string;
  resource: string;
  metadata?: unknown;
}) {
  const headerStore = await headers();
  const ipAddress =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    undefined;

  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
      ipAddress,
    },
  });
}

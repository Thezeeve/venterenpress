import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const snapshots = await prisma.platformHealthSnapshot.findMany({
    orderBy: { capturedAt: "desc" },
    take: 12,
  });

  return NextResponse.json({ data: snapshots });
}

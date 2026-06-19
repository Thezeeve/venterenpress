import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { priceMonthly: "asc" },
  });

  return NextResponse.json({ data: plans });
}

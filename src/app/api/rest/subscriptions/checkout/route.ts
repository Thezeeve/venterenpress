import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payments";
import { requireApiUser } from "@/lib/server-auth";
import { validateBrowserMutation } from "@/lib/security";

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
  const planId = body?.planId as string | undefined;

  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const gateway = getPaymentGateway(plan.provider);
  const checkout = await gateway.createCheckoutSession({
    userId: auth.user.id,
    planId,
    successUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard?checkout=success`,
    cancelUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard?checkout=cancelled`,
  });

  return NextResponse.json({ data: checkout });
}

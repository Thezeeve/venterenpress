import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateBrowserMutation } from "@/lib/security";
import { newsletterSignupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const browserCheck = validateBrowserMutation(request);
    if (!browserCheck.ok) {
      return NextResponse.json({ error: browserCheck.error }, { status: 403 });
    }

    const payload = await request.json();
    const parsed = newsletterSignupSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid newsletter signup" }, { status: 400 });
    }

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {
        name: parsed.data.name,
        topics: parsed.data.topics,
        regions: parsed.data.regions,
        status: "ACTIVE",
      },
      create: parsed.data,
    });

    return NextResponse.json({ data: subscriber }, { status: 201 });
  } catch {
    return NextResponse.json({ accepted: true }, { status: 202 });
  }
}

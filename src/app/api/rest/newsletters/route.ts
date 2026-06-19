import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueNewsletter } from "@/lib/jobs/queues";
import { requireApiUser } from "@/lib/server-auth";
import { newsletterCampaignSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser("newsletterManage");
  if (!auth.ok) {
    return auth.response;
  }

  const campaigns = await prisma.newsletterCampaign.findMany({
    include: {
      segment: true,
      article: true,
      createdBy: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: campaigns });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser("newsletterManage");
  if (!auth.ok) {
    return auth.response;
  }

  const payload = await request.json();
  const parsed = newsletterCampaignSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid newsletter campaign" }, { status: 400 });
  }

  const campaign = await prisma.newsletterCampaign.create({
    data: {
      title: parsed.data.title,
      subject: parsed.data.subject,
      preheader: parsed.data.preheader,
      bodyHtml: parsed.data.bodyHtml,
      articleId: parsed.data.articleId || null,
      segmentId: parsed.data.segmentId || null,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null,
      status: parsed.data.scheduledFor ? "SCHEDULED" : "DRAFT",
      createdById: auth.user.id,
    },
    include: {
      segment: true,
      article: true,
      createdBy: true,
    },
  });

  if (campaign.scheduledFor) {
    await enqueueNewsletter(campaign.id, campaign.scheduledFor);
  }

  return NextResponse.json({ data: campaign }, { status: 201 });
}

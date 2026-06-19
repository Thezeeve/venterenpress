import { NextResponse } from "next/server";
import { getHomepageNewsResponse } from "@/lib/news-providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getHomepageNewsResponse();
  return NextResponse.json(payload);
}

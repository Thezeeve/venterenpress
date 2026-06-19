import { NextResponse } from "next/server";
import { measureAsync } from "@/lib/logger";

export async function GET() {
  const payload = await measureAsync("health-check", async () => ({
    service: "global-press-network",
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return NextResponse.json(payload);
}

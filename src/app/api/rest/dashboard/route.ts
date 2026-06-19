import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-data";
import { requireApiUser } from "@/lib/server-auth";

export async function GET() {
  const auth = await requireApiUser("dashboardAccess");
  if (!auth.ok) {
    return auth.response;
  }

  const data = await getDashboardData(auth.user.id);
  return NextResponse.json(data);
}

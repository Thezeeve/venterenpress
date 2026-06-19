import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/rbac";

export async function getCurrentUser() {
  if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
    return null;
  }

  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireDashboardUser(permission: Permission = "dashboardAccess") {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user.role, permission)) {
    redirect("/");
  }

  return user;
}

export async function requireApiUser(permission?: Permission) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  if (permission && !hasPermission(user.role, permission)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    user: {
      ...user,
      role: user.role ?? Role.GUEST_READER,
    },
  };
}

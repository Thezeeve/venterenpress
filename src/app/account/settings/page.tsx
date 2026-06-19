import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountSettingsClient } from "@/components/account/account-settings-client";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      bio: true,
      locale: true,
      timezone: true,
      notificationPreferences: true,
      newsletterPreferences: true,
      email: true,
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Account settings</Badge>
      <h1 className="mt-4 font-serif text-5xl">Profile and preferences</h1>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Reader profile</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountSettingsClient initialUser={profile ?? {}} />
        </CardContent>
      </Card>
    </main>
  );
}

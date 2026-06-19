import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AccountSubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
    include: { plan: true },
    orderBy: { startedAt: "desc" },
  });
  const transactions = await prisma.paymentTransaction.findMany({
    where: { userId: user.id },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Subscriber Account</Badge>
      <h1 className="mt-4 font-serif text-5xl">Subscription & billing</h1>
      <Card className="mt-8">
        <CardHeader><CardTitle>Current plan</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>Subscriber: {user.name ?? user.email}</div>
          <div>Plan: {subscription?.plan.name ?? "No active plan"}</div>
          <div>Status: {subscription?.status ?? "Inactive"}</div>
          <div>Renews: {subscription?.renewsAt?.toLocaleDateString() ?? "N/A"}</div>
          <div className="pt-2">
            <Button asChild variant="outline">
              <Link href="/pricing">View plans</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader><CardTitle>Receipts and invoices</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {transactions.length ? transactions.map((transaction) => (
            <div key={transaction.id} className="rounded-2xl border border-[var(--border)] p-4">
              <div className="font-medium">{transaction.plan?.name ?? "Billing event"}</div>
              <div className="text-[var(--muted-foreground)]">{transaction.status} | ${transaction.amount.toString()} {transaction.currency}</div>
            </div>
          )) : <div className="text-[var(--muted-foreground)]">No billing records yet.</div>}
        </CardContent>
      </Card>
    </main>
  );
}

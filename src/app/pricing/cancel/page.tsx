import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PricingCancelPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge>Checkout canceled</Badge>
      <Card className="mt-6">
        <CardContent className="space-y-4 p-8">
          <h1 className="font-serif text-4xl">Checkout was canceled</h1>
          <p className="text-[var(--muted-foreground)]">No charge was made. You can review plans again when you are ready.</p>
          <Button asChild><Link href="/pricing">Return to pricing</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}

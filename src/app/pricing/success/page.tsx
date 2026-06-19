import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PricingSuccessPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge>Checkout complete</Badge>
      <Card className="mt-6">
        <CardContent className="space-y-4 p-8">
          <h1 className="font-serif text-4xl">Your subscription is active</h1>
          <p className="text-[var(--muted-foreground)]">Your access has been unlocked. You can now save articles, follow journalists, and read premium coverage.</p>
          <div className="flex gap-3">
            <Button asChild><Link href="/account/subscription">Manage subscription</Link></Button>
            <Button asChild variant="outline"><Link href="/">Browse stories</Link></Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

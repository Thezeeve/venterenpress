import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdvertiseInquiryPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge>Advertiser inquiry</Badge>
      <Card className="mt-6">
        <CardContent className="space-y-4 p-8">
          <h1 className="font-serif text-4xl">Start an advertising conversation</h1>
          <p className="text-[var(--muted-foreground)]">Reach newsroom audiences with display, sponsorship, and custom campaign packages.</p>
          <Button>Contact sales</Button>
        </CardContent>
      </Card>
    </main>
  );
}

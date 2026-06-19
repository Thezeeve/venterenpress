import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function SponsoredContentPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge>Sponsored content</Badge>
      <Card className="mt-6">
        <CardContent className="space-y-4 p-8">
          <h1 className="font-serif text-4xl">Submit a sponsored report</h1>
          <p className="text-[var(--muted-foreground)]">Editorial review, disclosure labeling, and enterprise distribution controls are handled by the newsroom.</p>
        </CardContent>
      </Card>
    </main>
  );
}

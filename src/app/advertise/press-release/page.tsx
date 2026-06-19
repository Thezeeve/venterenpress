import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PressReleasePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge>Press release</Badge>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardContent className="space-y-6 p-8">
            <h1 className="font-serif text-4xl">Submit a press release</h1>
            <p className="text-[var(--muted-foreground)]">
              Press release publishing routes through the commercial intake layer with audience targeting, review checkpoints, and edition selection.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Standard", "$1,500", "48-hour review and publication window"],
                ["Priority", "$3,200", "Same-day review and homepage promo options"],
                ["Enterprise", "Custom", "Regional targeting, translation, and reporting wraparound"],
              ].map(([name, price, summary]) => (
                <div key={name} className="rounded-[24px] border border-[var(--border)] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{name}</div>
                  <div className="mt-2 text-2xl font-semibold">{price}</div>
                  <div className="mt-2 text-sm text-[var(--muted-foreground)]">{summary}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Intake checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-[var(--muted-foreground)]">
            <div>Company details, primary contact, billing email, and website.</div>
            <div>Target edition, intended publication date, and urgency level.</div>
            <div>Disclosure label, supporting assets, and compliance notes for regulated claims.</div>
            <div>Optional translation, newsletter inclusion, or sponsored amplification.</div>
            <Button asChild variant="outline">
              <Link href="/advertise/inquiry">Start intake</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Publication flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-[var(--muted-foreground)]">
            <div>1. Submit release details and assets.</div>
            <div>2. Commercial review confirms disclosure, audience fit, and pricing.</div>
            <div>3. Editorial operations schedule the release and apply labels.</div>
            <div>4. Reporting and analytics are shared after publication.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Submission policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-[var(--muted-foreground)]">
            <div>Sponsored and press release content is clearly labeled and separated from independent reporting.</div>
            <div>VANTERENPRESS may reject misleading, unverifiable, or legally risky submissions.</div>
            <div>For integrated campaigns, use the full media kit and sponsored content workflow.</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


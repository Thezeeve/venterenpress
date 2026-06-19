import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function TrustPage({
  badge,
  title,
  summary,
  sections,
  cta,
}: {
  badge: string;
  title: string;
  summary: string;
  sections: { title: string; body: string[] }[];
  cta?: { label: string; href: string };
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge>{badge}</Badge>
      <h1 className="mt-4 font-serif text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">{summary}</p>
      <div className="mt-10 space-y-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent className="space-y-4 p-8">
              <h2 className="font-serif text-3xl">{section.title}</h2>
              <div className="space-y-3 text-sm leading-7 text-[var(--muted-foreground)]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {cta ? (
        <div className="mt-10">
          <Link href={cta.href} className="text-sm font-medium text-[var(--accent)] underline underline-offset-4">
            {cta.label}
          </Link>
        </div>
      ) : null}
    </main>
  );
}

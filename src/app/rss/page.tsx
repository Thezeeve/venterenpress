import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const feeds = [
  { title: "Main feed", href: "/feed.xml", description: "Latest published stories across the newsroom." },
  { title: "Latest news", href: "/latest", description: "Chronological coverage landing page." },
  { title: "Most read", href: "/most-read", description: "Audience-ranked story packages." },
  { title: "Video", href: "/video", description: "Video publishing and broadcast coverage." },
  { title: "Podcasts", href: "/podcasts", description: "Podcast network releases and episode pages." },
  { title: "Subscribe", href: "/subscribe", description: "Reader briefing and newsletter sign-up." },
];

export default function RssDirectoryPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Distribution</Badge>
      <h1 className="mt-4 font-serif text-5xl">Newsroom feeds</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">
        Access VANTERENPRESS publication feeds, section indexes, and newsroom products.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Global feed", "Latest published reporting across the publication."],
          ["Section feeds", "Desk and topic routes for focused coverage."],
          ["Newsroom products", "Briefings, indexes, and audience-facing publication surfaces."],
        ].map(([title, description]) => (
          <Card key={title}>
            <CardContent className="p-5 text-sm text-[var(--muted-foreground)]">
              <div className="font-medium text-[var(--foreground)]">{title}</div>
              <div className="mt-2">{description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {feeds.map((feed) => (
          <Link key={feed.href} href={feed.href}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{feed.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted-foreground)]">
                {feed.description}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

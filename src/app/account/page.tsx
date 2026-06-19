import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  { href: "/account/settings", title: "Account settings", description: "Profile, locale, timezone, and notification preferences." },
  { href: "/account/saved", title: "Saved articles", description: "Bookmarks and premium reading list." },
  { href: "/account/following", title: "Followed authors", description: "Journalists and editors you follow." },
  { href: "/account/history", title: "Reading history", description: "Recent article activity and access logs." },
  { href: "/account/notifications", title: "Notifications", description: "Recent alerts, comments, and editorial updates." },
  { href: "/account/newsletters", title: "Newsletter preferences", description: "Topics, regions, and briefing frequency." },
];

export default function AccountHomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge>Reader account</Badge>
      <h1 className="mt-4 font-serif text-5xl">Manage your reading experience</h1>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-transform duration-200 hover:-translate-y-1">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted-foreground)]">{section.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

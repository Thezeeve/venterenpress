import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { NewsletterSignupSection } from "@/components/newsroom/newsletter-signup-section";
import { Badge } from "@/components/ui/badge";
import type { BrandConfig } from "@/lib/brand";

export function AppShell({
  brand,
  children,
}: {
  brand: BrandConfig;
  children: ReactNode;
}) {
  const showDemoBanner = process.env.SHOW_DEMO_HINTS === "true";

  return (
    <div className="min-h-screen" data-app-shell>
      {showDemoBanner ? (
        <div className="border-b border-[var(--border)] bg-[var(--accent-soft)] px-4 py-2 text-sm text-[var(--foreground)]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:px-2">
            <div className="flex items-center gap-3">
              <Badge variant="neutral">Internal access</Badge>
              <span>Staging environment with seeded newsroom accounts and launch content.</span>
            </div>
            <div className="text-[var(--muted-foreground)]">
              Login hints: admin@globalpress.network, eic@globalpress.network, journalist@globalpress.network, subscriber@globalpress.network
            </div>
          </div>
        </div>
      ) : null}
      <div data-public-chrome="header">
        <SiteHeader brand={brand} />
      </div>
      {children}
      <div data-public-chrome="newsletter">
        <NewsletterSignupSection />
      </div>
      <div data-public-chrome="footer">
        <SiteFooter brand={brand} />
      </div>
      <div
        data-public-chrome="statusbar"
        className="border-t border-[var(--border)] bg-[var(--panel)]/94 px-4 py-3.5 text-sm text-[var(--muted-foreground)] backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:px-2">
          <span className="font-medium tracking-[0.02em]">{brand.name}</span>
          <Link href="/status" className="text-[var(--foreground)] underline underline-offset-4">Status</Link>
        </div>
      </div>
    </div>
  );
}

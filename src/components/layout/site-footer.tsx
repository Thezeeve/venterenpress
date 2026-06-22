import Link from "next/link";
import type { BrandConfig } from "@/lib/brand";

export function SiteFooter({ brand }: { brand: BrandConfig }) {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--panel)]/96 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.55fr_repeat(3,minmax(0,0.95fr))] lg:gap-10 lg:px-8">
        <div className="space-y-4 text-left">
          <h3 className="font-serif text-[1.85rem] font-semibold">{brand.name}</h3>
          <p className="max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">{brand.footerCopy}</p>
          <div className="text-sm font-medium text-[var(--muted-foreground)]">{brand.supportEmail}</div>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Company</div>
          <div className="grid gap-2.5 text-sm">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/careers">Careers</Link>
            <Link href="/advertise">Advertise</Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">News</div>
          <div className="grid gap-2.5 text-sm">
            <Link href="/latest">Latest News</Link>
            <Link href="/world">World</Link>
            <Link href="/politics">Politics</Link>
            <Link href="/technology">Technology</Link>
            <Link href="/crypto">Crypto</Link>
            <Link href="/sports">Sports</Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Policies</div>
          <div className="grid gap-2.5 text-sm">
            <Link href="/ethics">Ethics Policy</Link>
            <Link href="/editorial-standards">Editorial Standards</Link>
            <Link href="/corrections">Corrections Policy</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

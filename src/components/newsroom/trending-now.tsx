import Link from "next/link";
import type { ReactNode } from "react";

export type TrendingItem = {
  id: string;
  href: string;
  title: string;
  category: string;
  isExternal?: boolean;
};

function TrendingLink({
  href,
  isExternal,
  className,
  children,
}: {
  href: string;
  isExternal?: boolean;
  className: string;
  children: ReactNode;
}) {
  if (isExternal && !href.startsWith("/")) {
    return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  }

  return <Link href={href} className={className}>{children}</Link>;
}

export function TrendingNow({ items, compact = false }: { items: TrendingItem[]; compact?: boolean }) {
  return (
    <section
      className={
        compact
          ? "rounded-[22px] border border-[var(--border)] bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]"
          : "rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
      }
    >
      <div className={compact ? "mb-3 flex items-center gap-3" : "mb-4 flex items-center gap-3"}>
        <span className="h-6 w-1 rounded-full bg-[#D8261D]" />
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">Reader Demand</div>
          <h2 className={compact ? "mt-1 font-serif text-[1.45rem] leading-tight" : "mt-1 font-serif text-[1.8rem]"}>
            Trending Now
          </h2>
        </div>
      </div>
      <div className={compact ? "space-y-1" : "space-y-1.5"}>
        {items.map((item, index) => (
          <TrendingLink
            key={item.id}
            href={item.href}
            isExternal={item.isExternal}
            className={
              compact
                ? "grid grid-cols-[28px_1fr] gap-3 rounded-[16px] px-2 py-2 transition hover:bg-[var(--muted)]/45"
                : "grid grid-cols-[32px_1fr] gap-3 rounded-[18px] px-2 py-2.5 transition hover:bg-[var(--muted)]/55"
            }
          >
            <div
              className={
                compact
                  ? "font-serif text-[1.15rem] leading-none text-[#D8261D]"
                  : "font-serif text-[1.3rem] leading-none text-[#D8261D]"
              }
            >
              {index + 1}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {item.category}
              </div>
              <div className={compact ? "mt-1 text-[0.92rem] leading-6 text-[var(--foreground)]" : "mt-1 text-sm leading-6 text-[var(--foreground)]"}>
                {item.title}
              </div>
            </div>
          </TrendingLink>
        ))}
      </div>
    </section>
  );
}

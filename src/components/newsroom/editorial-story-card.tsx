import Link from "next/link";
import type { ReactNode } from "react";
import { ConditionalNewsImage } from "@/components/newsroom/conditional-news-image";

export type EditorialStoryCardProps = {
  href: string;
  title: string;
  category: string;
  summary: string;
  publishedLabel: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  isExternal?: boolean;
};

function StoryLink({
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

export function EditorialStoryCard({
  href,
  title,
  category,
  summary,
  publishedLabel,
  imageUrl,
  imageAlt,
  isExternal,
}: EditorialStoryCardProps) {
  return (
    <StoryLink
      href={href}
      isExternal={isExternal}
      className="group block overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]"
    >
      <ConditionalNewsImage
        src={imageUrl}
        alt={imageAlt ?? title}
        sizes="(max-width: 768px) 100vw, 360px"
        containerClassName="relative h-48 overflow-hidden border-b border-[var(--border)] bg-[var(--muted)]"
        imageClassName="object-cover object-center transition duration-300 group-hover:scale-[1.02]"
      />
      <div className="space-y-3 p-5 sm:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{category}</div>
        <h3 className="font-serif text-[1.32rem] leading-[1.18] text-[var(--foreground)]">{title}</h3>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{summary}</p>
        <div className="pt-1 text-sm text-[var(--muted-foreground)]">{publishedLabel}</div>
      </div>
    </StoryLink>
  );
}

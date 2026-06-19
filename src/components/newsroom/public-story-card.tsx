import Link from "next/link";
import { ConditionalNewsImage } from "@/components/newsroom/conditional-news-image";

export type PublicStoryCardProps = {
  href: string;
  title: string;
  excerpt?: string | null;
  category: string;
  publishedLabel: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  isExternal?: boolean;
};

export function PublicStoryCard({
  href,
  title,
  excerpt,
  category,
  publishedLabel,
  imageUrl,
  imageAlt,
  isExternal,
}: PublicStoryCardProps) {
  const content = (
    <article className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-[2px] hover:border-black/10 hover:shadow-[0_16px_32px_rgba(15,23,42,0.075)]">
      <ConditionalNewsImage
        src={imageUrl}
        alt={imageAlt ?? title}
        sizes="(max-width: 768px) 100vw, 380px"
        containerClassName="relative aspect-[16/10] overflow-hidden border-b border-[var(--border)] bg-[var(--muted)]"
        imageClassName="object-cover object-center transition duration-300"
      />
      <div className="space-y-3.5 p-5 sm:p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">{category}</div>
        <h2 className="font-serif text-[1.32rem] leading-[1.22] tracking-[-0.01em] text-[var(--foreground)] sm:text-[1.38rem]">{title}</h2>
        {excerpt ? <p className="text-sm leading-[1.72] text-[var(--muted-foreground)]">{excerpt}</p> : null}
        <div className="pt-1 text-[0.92rem] text-[var(--muted-foreground)]">{publishedLabel}</div>
      </div>
    </article>
  );

  if (isExternal && !href.startsWith("/")) {
    return <a href={href} target="_blank" rel="noreferrer">{content}</a>;
  }

  return <Link href={href}>{content}</Link>;
}

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--muted)] px-6 py-10 text-center",
        className,
      )}
    >
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
        {description}
      </p>
    </div>
  );
}

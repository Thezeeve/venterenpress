"use client";

import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-2 text-sm outline-none focus:border-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}

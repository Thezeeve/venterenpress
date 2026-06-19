import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-2 text-sm outline-none ring-0 placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)]",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
